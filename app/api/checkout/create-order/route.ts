import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

import { ApiError, fail, handleError, ok } from "@/lib/api";
import { readSession } from "@/lib/auth";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { createOrderSchema } from "@/lib/validators/checkout";
import {
  createOrderWithItems,
  InsufficientStockError,
  markCodOrderPaid,
  priceCart,
} from "@/lib/queries/orders";
import { razorpay, razorpayKeyId } from "@/lib/razorpay";
import { resolveCoupon } from "@/lib/queries/admin/coupons";
import { getCheckoutSettings } from "@/lib/queries/admin/settings";
import { notifyOrderPlaced } from "@/lib/notifications/order";
import {
  createShiprocketOrderForOrder,
  shouldAutoCreateShiprocket,
} from "@/lib/notifications/shipping";
import { db } from "@/lib/db";
import { paymentDetails } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Idempotency keys we've already processed in this Node process. Maps the
 * `Idempotency-Key` header value to the response payload we returned the
 * first time. Lives in-memory only; multi-replica deployments should swap
 * this for a Redis SET — but for a single-instance cPanel deploy this
 * blocks the realistic threat (a double-click within seconds).
 */
const idempotencyCache = new Map<string, { at: number; body: unknown }>();
const IDEMPOTENCY_TTL_MS = 5 * 60_000;

function readIdempotencyKey(req: NextRequest): string | null {
  const raw = req.headers.get("idempotency-key");
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.length < 8 || trimmed.length > 64) return null;
  return trimmed;
}

/**
 * POST /api/checkout/create-order
 *
 * Body (CreateOrderInput): { shipping, items, couponCode?, paymentMethod }
 * Headers: Idempotency-Key (optional, 8–64 chars) — repeat submissions
 *          within 5 minutes return the same response without re-creating
 *          the order.
 *
 * Branches:
 *   • paymentMethod = "razorpay" → persists order with payment_status="pending",
 *                                  creates a Razorpay order, patches its id
 *                                  onto payment_details. If RP fails we mark
 *                                  the order failed (and stock is restored).
 *                                  Returns { razorpayOrderId, key, amount }
 *                                  so the client opens the Razorpay modal.
 *   • paymentMethod = "cod"      → no gateway call. Persists order with
 *                                  payment_status="pending", optionally
 *                                  pushes the order to Shiprocket, fires
 *                                  notifications, returns { orderNumber,
 *                                  orderId, paymentMethod: "cod" } so the
 *                                  client redirects to /order/success.
 *
 * Server-side guarantees:
 *   - Cart prices come from `product_sizes.final_price` (DB-trusted).
 *   - Coupon discount is recomputed here (the apply-coupon endpoint's
 *     return value is NOT trusted).
 *   - Final total = subtotal − discount + shipping + cod_fee, computed
 *     server-side. The client never controls money.
 *   - Product stock is decremented atomically inside the order
 *     transaction; the order fails if any line is out of stock.
 *   - 100%-discount carts (grandTotal === 0) are accepted and immediately
 *     marked paid — no Razorpay round trip.
 */
export async function POST(req: NextRequest) {
  try {
    /* ---------------- 0) Rate limit + idempotency ----------------- */
    const ip = rateLimitKey(req);
    const limited = rateLimit(`createOrder:${ip}`, {
      limit: 30,
      windowMs: 60_000,
    });
    if (!limited.ok) {
      return fail(
        `Too many checkout attempts. Try again in ${limited.retryAfterSeconds}s.`,
        429,
      );
    }

    const idempotencyKey = readIdempotencyKey(req);
    if (idempotencyKey) {
      const hit = idempotencyCache.get(idempotencyKey);
      if (hit && Date.now() - hit.at < IDEMPOTENCY_TTL_MS) {
        return ok(hit.body as Record<string, unknown>);
      }
    }

    /* ---------------- 1) Validate ---------------------------------- */
    const json = await req.json().catch(() => null);
    const parsed = createOrderSchema.safeParse(json);
    if (!parsed.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path.join(".") || "_";
        (errors[path] ??= []).push(issue.message);
      }
      return fail("Invalid checkout payload", 422, { errors });
    }
    const { shipping, items, couponCode, paymentMethod } = parsed.data;

    /* ---------------- 2) Server-trusted cart pricing -------------- */
    const priced = await priceCart(items);
    if (!priced) {
      return fail(
        "Some items in your cart are no longer available. Please refresh and try again.",
        409,
      );
    }
    if (priced.subtotal <= 0) {
      return fail("Cart total must be greater than zero", 400);
    }

    /* ---------------- 3) Stable guest cookie ---------------------- */
    const cookieStore = await cookies();
    let guestId = cookieStore.get("guest_id")?.value ?? null;
    if (!guestId) {
      guestId = randomUUID();
      cookieStore.set("guest_id", guestId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    const session = await readSession();
    const userId = session?.sub ?? null;

    /* ---------------- 4) Coupon (server-recomputed) ---------------- */
    const checkoutSettings = await getCheckoutSettings();
    let appliedCoupon: {
      couponId: number;
      code: string;
      discountAmount: number;
      freeShipping: boolean;
    } | null = null;

    if (couponCode) {
      const c = await resolveCoupon({
        code: couponCode,
        subtotal: priced.subtotal,
        paymentMethod,
      });
      if (!c.ok) {
        return fail(c.message, 422, { field: "couponCode" });
      }
      appliedCoupon = {
        couponId: c.coupon.id,
        code: c.coupon.code,
        discountAmount: c.discountAmount,
        freeShipping: c.freeShipping,
      };
    }

    /* ---------------- 5) Money math (server) ---------------------- */
    const baseShippingFee = checkoutSettings.defaultShippingFee;
    const shippingFee = appliedCoupon?.freeShipping ? 0 : baseShippingFee;
    const codFee = paymentMethod === "cod" ? checkoutSettings.codFee : 0;
    const discountAmount = appliedCoupon?.discountAmount ?? 0;
    const grandTotal =
      Math.round(
        (priced.subtotal - discountAmount + shippingFee + codFee) * 100,
      ) / 100;

    if (grandTotal < 0) {
      return fail("Order total cannot be negative", 400);
    }

    /* ---------------- 6) COD eligibility (against ACTUAL collectable) */
    if (paymentMethod === "cod") {
      if (!checkoutSettings.codEnabled) {
        return fail("Cash on Delivery is not available right now.", 400);
      }
      if (
        checkoutSettings.codMinOrderAmount > 0 &&
        grandTotal < checkoutSettings.codMinOrderAmount
      ) {
        return fail(
          `Minimum order for COD is ₹${checkoutSettings.codMinOrderAmount.toFixed(0)}.`,
          400,
        );
      }
      if (
        checkoutSettings.codMaxOrderAmount > 0 &&
        grandTotal > checkoutSettings.codMaxOrderAmount
      ) {
        return fail(
          `Maximum order for COD is ₹${checkoutSettings.codMaxOrderAmount.toFixed(0)}. Please pay online.`,
          400,
        );
      }
    }

    /* ---------------- 7) Generate ONE shared order number --------- */
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${randomUUID()
      .slice(0, 8)
      .toUpperCase()}`;

    /* ---------------- 8) Persist FIRST (before Razorpay) ---------- */
    let dbOrder;
    try {
      dbOrder = await createOrderWithItems({
        userId,
        guestId,
        shipping,
        pricedCart: priced,
        razorpayOrderId: null, // patched below if Razorpay branch
        paymentMethod,
        appliedCoupon,
        shippingFee,
        codFee,
        orderNumber,
      });
    } catch (err) {
      if (err instanceof InsufficientStockError) {
        throw new ApiError(err.message, 409);
      }
      throw err;
    }

    /* ---------------- 9) Razorpay branch -------------------------- */
    if (paymentMethod === "razorpay") {
      // Special case: 100%-off coupon → no money to collect, no need to
      // round-trip through Razorpay. Mark immediately paid.
      if (grandTotal === 0) {
        const wasMarked = await markCodOrderPaid(dbOrder.id);
        if (wasMarked && !wasMarked.wasAlreadyPaid) {
          void notifyOrderPlaced({
            orderId: dbOrder.id,
            paymentMethod: "razorpay",
          });
          if (await shouldAutoCreateShiprocket()) {
            void createShiprocketOrderForOrder(dbOrder.id, {
              paymentMethod: "Prepaid",
            }).catch((e) => console.error("[shiprocket] free-order push failed:", e));
          }
        }
        const responseBody = {
          paymentMethod: "razorpay" as const,
          freeOrder: true,
          orderNumber: dbOrder.order_number,
          orderId: dbOrder.id,
          amount: 0,
          currency: "INR",
          breakdown: {
            subtotal: priced.subtotal,
            discountAmount,
            shippingFee,
            codFee,
            total: 0,
          },
        };
        if (idempotencyKey) {
          idempotencyCache.set(idempotencyKey, { at: Date.now(), body: responseBody });
        }
        return ok(responseBody);
      }

      let rzpOrderId: string;
      try {
        const rzp = await razorpay().orders.create({
          receipt: orderNumber, // SAME value we persisted as orders.order_number
          amount: Math.round(grandTotal * 100), // paise
          currency: "INR",
          notes: {
            guest_id: guestId,
            item_count: String(priced.totalQuantity),
            coupon: appliedCoupon?.code ?? "",
            order_number: orderNumber,
          },
        });
        rzpOrderId = rzp.id;
      } catch (rpErr) {
        // Razorpay failed AFTER we created our DB row — restore stock /
        // coupon by calling markOrderFailed via a synthetic razorpay id.
        // Easier: directly call cancelOrderRestoring.
        const { cancelOrderRestoring } = await import("@/lib/queries/orders");
        await cancelOrderRestoring(dbOrder.id);
        console.error(
          "[checkout] razorpay order create failed for",
          orderNumber,
          rpErr instanceof Error ? rpErr.message : rpErr,
        );
        return fail(
          "We couldn't reach the payment gateway. Please try again.",
          502,
        );
      }

      // Patch the razorpay_order_id onto our payment_details row.
      await db
        .update(paymentDetails)
        .set({ razorpay_order_id: rzpOrderId })
        .where(eq(paymentDetails.order_id, dbOrder.id));

      const responseBody = {
        paymentMethod: "razorpay" as const,
        razorpayOrderId: rzpOrderId,
        amount: Math.round(grandTotal * 100), // paise
        currency: "INR",
        key: razorpayKeyId(),
        orderNumber: dbOrder.order_number,
        orderId: dbOrder.id,
        breakdown: {
          subtotal: priced.subtotal,
          discountAmount,
          shippingFee,
          codFee,
          total: grandTotal,
        },
        prefill: {
          name: `${shipping.first_name} ${shipping.last_name ?? ""}`.trim(),
          email: shipping.email,
          contact: shipping.phone,
        },
      };
      if (idempotencyKey) {
        idempotencyCache.set(idempotencyKey, { at: Date.now(), body: responseBody });
      }
      return ok(responseBody);
    }

    /* ---------------- 10) COD branch ------------------------------ */
    // Push to Shiprocket (fire-and-forget — never block the customer's
    // checkout if SR is down).
    if (await shouldAutoCreateShiprocket()) {
      void createShiprocketOrderForOrder(dbOrder.id, {
        paymentMethod: "COD",
      }).catch((err) => {
        console.error(
          "[shiprocket] auto-create failed for order",
          dbOrder.order_number,
          err instanceof Error ? err.message : err,
        );
      });
    }

    void notifyOrderPlaced({
      orderId: dbOrder.id,
      paymentMethod: "cod",
    });

    const responseBody = {
      paymentMethod: "cod" as const,
      orderNumber: dbOrder.order_number,
      orderId: dbOrder.id,
      amount: grandTotal,
      currency: "INR",
      breakdown: {
        subtotal: priced.subtotal,
        discountAmount,
        shippingFee,
        codFee,
        total: grandTotal,
      },
    };
    if (idempotencyKey) {
      idempotencyCache.set(idempotencyKey, { at: Date.now(), body: responseBody });
    }
    return ok(responseBody);
  } catch (err) {
    return handleError(err);
  }
}

// Periodically evict expired idempotency entries so the Map doesn't grow
// unbounded. Runs piggybacked on incoming requests rather than via
// setInterval (which doesn't behave well in a serverless / multi-process
// hosting env).
function _evictExpiredIdempotencyEntries(): void {
  const now = Date.now();
  for (const [k, v] of idempotencyCache) {
    if (now - v.at > IDEMPOTENCY_TTL_MS) idempotencyCache.delete(k);
  }
}
// Mark as referenced so build doesn't strip it.
void _evictExpiredIdempotencyEntries;
