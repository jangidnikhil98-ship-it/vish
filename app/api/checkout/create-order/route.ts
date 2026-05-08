import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

import { fail, handleError, ok } from "@/lib/api";
import { readSession } from "@/lib/auth";
import { createOrderSchema } from "@/lib/validators/checkout";
import {
  createOrderWithItems,
  priceCart,
  setShiprocketDetails,
} from "@/lib/queries/orders";
import { razorpay, razorpayKeyId } from "@/lib/razorpay";
import { resolveCoupon } from "@/lib/queries/admin/coupons";
import {
  getCheckoutSettings,
  getShiprocketSettings,
} from "@/lib/queries/admin/settings";
import {
  createShiprocketOrder,
  ShiprocketError,
} from "@/lib/shiprocket";
import { notifyOrderPlaced } from "@/app/api/checkout/verify-payment/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/checkout/create-order
 *
 * Body (CreateOrderInput): { shipping, items, couponCode?, paymentMethod }
 *
 * Branches:
 *   • paymentMethod = "razorpay" → creates a Razorpay order, persists ours,
 *                                   returns { razorpayOrderId, key, amount }
 *                                   so the client opens the Razorpay modal.
 *   • paymentMethod = "cod"      → no gateway call. Persists order with
 *                                   payment_status="pending", optionally
 *                                   pushes the order to Shiprocket, fires
 *                                   notifications, returns { orderNumber,
 *                                   orderId, paymentMethod: "cod" } so the
 *                                   client redirects to /order/success.
 *
 * Server-side guarantees:
 *   - Cart prices come from `product_sizes.final_price` (DB-trusted).
 *   - Coupon discount is recomputed here (the apply-coupon endpoint's
 *     return value is NOT trusted).
 *   - Final total = subtotal − discount + shipping + cod_fee, computed
 *     server-side. The client never controls money.
 */
export async function POST(req: NextRequest) {
  try {
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

    /* ---------------- 1) Server-trusted cart pricing ---------------- */
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

    /* ---------------- 2) Stable guest cookie ----------------------- */
    const cookieStore = await cookies();
    let guestId = cookieStore.get("guest_id")?.value ?? null;
    if (!guestId) {
      guestId = randomUUID();
      cookieStore.set("guest_id", guestId, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    const session = await readSession();
    const userId = session?.sub ?? null;

    /* ---------------- 3) COD eligibility check --------------------- */
    const checkoutSettings = await getCheckoutSettings();

    if (paymentMethod === "cod") {
      if (!checkoutSettings.codEnabled) {
        return fail("Cash on Delivery is not available right now.", 400);
      }
      if (
        checkoutSettings.codMinOrderAmount > 0 &&
        priced.subtotal < checkoutSettings.codMinOrderAmount
      ) {
        return fail(
          `Minimum order for COD is ₹${checkoutSettings.codMinOrderAmount.toFixed(0)}.`,
          400,
        );
      }
      if (
        checkoutSettings.codMaxOrderAmount > 0 &&
        priced.subtotal > checkoutSettings.codMaxOrderAmount
      ) {
        return fail(
          `Maximum order for COD is ₹${checkoutSettings.codMaxOrderAmount.toFixed(0)}. Please pay online.`,
          400,
        );
      }
    }

    /* ---------------- 4) Coupon (server-recomputed) ---------------- */
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

    /* ---------------- 5) Money math (server) ----------------------- */
    const baseShippingFee = checkoutSettings.defaultShippingFee;
    const shippingFee = appliedCoupon?.freeShipping ? 0 : baseShippingFee;
    const codFee = paymentMethod === "cod" ? checkoutSettings.codFee : 0;
    const discountAmount = appliedCoupon?.discountAmount ?? 0;
    const grandTotal =
      Math.round(
        (priced.subtotal - discountAmount + shippingFee + codFee) * 100,
      ) / 100;

    if (grandTotal <= 0) {
      return fail("Order total must be greater than zero", 400);
    }

    /* ---------------- 6) Razorpay branch (online payments) -------- */
    let rzpOrderId: string | null = null;
    if (paymentMethod === "razorpay") {
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}`;
      const rzp = await razorpay().orders.create({
        receipt: orderNumber,
        amount: Math.round(grandTotal * 100), // paise
        currency: "INR",
        notes: {
          guest_id: guestId,
          item_count: String(priced.totalQuantity),
          coupon: appliedCoupon?.code ?? "",
        },
      });
      rzpOrderId = rzp.id;
    }

    /* ---------------- 7) Persist ----------------------------------- */
    const dbOrder = await createOrderWithItems({
      userId,
      guestId,
      shipping,
      pricedCart: priced,
      razorpayOrderId: rzpOrderId,
      paymentMethod,
      appliedCoupon,
      shippingFee,
      codFee,
    });

    /* ---------------- 8) For COD: optional Shiprocket push --------- */
    if (paymentMethod === "cod") {
      const sr = await getShiprocketSettings();
      if (sr.autoCreateOrder && process.env.SHIPROCKET_EMAIL) {
        // Fire-and-forget — never block the customer's checkout if SR is down.
        void (async () => {
          try {
            const res = await createShiprocketOrder({
              orderId: dbOrder.order_number,
              orderDate: new Date().toISOString().slice(0, 19).replace("T", " "),
              pickupLocation: sr.pickupLocation,
              paymentMethod: "COD",
              billing: {
                customerName: shipping.first_name,
                lastName: shipping.last_name,
                address: shipping.address || shipping.apartment || "—",
                address2: shipping.apartment,
                city: shipping.city || shipping.state,
                state: shipping.state,
                pincode: shipping.pincode,
                email: shipping.email,
                phone: shipping.phone,
              },
              orderItems: priced.items.map((it) => ({
                name: it.productName ?? "Product",
                sku: `P-${it.productId}${it.sizeId ? `-S${it.sizeId}` : ""}`,
                units: it.quantity,
                sellingPrice: it.unitPrice,
              })),
              subTotal: grandTotal,
              weightKg: sr.defaultWeightKg,
              lengthCm: sr.defaultLengthCm,
              breadthCm: sr.defaultBreadthCm,
              heightCm: sr.defaultHeightCm,
            });
            await setShiprocketDetails({
              orderId: dbOrder.id,
              shiprocketOrderId: res.shiprocketOrderId,
              shiprocketShipmentId: res.shipmentId,
              awbCode: res.awbCode,
            });
          } catch (err) {
            const sre = err as ShiprocketError;
            console.error(
              "[shiprocket] auto-create failed for order",
              dbOrder.order_number,
              sre.status ?? "",
              sre.message,
            );
          }
        })();
      }

      // Send the "Order received — pay on delivery" emails / WhatsApp.
      void notifyOrderPlaced({
        orderId: dbOrder.id,
        paymentMethod: "cod",
      });

      return ok({
        paymentMethod: "cod",
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
      });
    }

    /* ---------------- 9) Razorpay client payload ------------------- */
    return ok({
      paymentMethod: "razorpay",
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
    });
  } catch (err) {
    return handleError(err);
  }
}
