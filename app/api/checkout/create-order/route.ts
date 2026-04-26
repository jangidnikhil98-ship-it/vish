import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { fail, handleError, ok } from "@/lib/api";
import { readSession } from "@/lib/auth";
import { createOrderSchema } from "@/lib/validators/checkout";
import { createOrderWithItems, priceCart } from "@/lib/queries/orders";
import { razorpay, razorpayKeyId } from "@/lib/razorpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/checkout/create-order
 *
 * Body: { shipping, items }   (see lib/validators/checkout.ts)
 *
 * Mirrors PaymentController::create with these corrections:
 *   - Cart prices come from the DB (server-trusted), not the client.
 *   - `orders.grand_total` is stored in INR (matches DECIMAL(10,2)).
 *   - `order_items` are persisted (was missing in the Laravel version).
 *   - `payment_details.status` starts as 'created' (was 'completed').
 *   - `payment_details.amount` is saved.
 *
 * Returns:
 *   { razorpayOrderId, amount, currency, key, orderNumber, orderId }
 *   `amount` is in **paise** (Razorpay convention).
 */
export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = createOrderSchema.safeParse(json);
    if (!parsed.success) {
      // Build a {dotted.path: ["msg"]} map so the client can show per-field
      // hints (e.g. shipping.phone -> "Phone must be exactly 10 digits").
      const errors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path.join(".") || "_";
        (errors[path] ??= []).push(issue.message);
      }
      return fail("Invalid checkout payload", 422, { errors });
    }
    const { shipping, items } = parsed.data;

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

    // Stable guest_id cookie so the same browser is recognised across requests.
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

    // Attach the order to the logged-in user (if any) so they can see it on
    // their /dashboard/orders page later.
    const session = await readSession();
    const userId = session?.sub ?? null;

    // Razorpay expects integer paise.
    const amountInPaise = Math.round(priced.subtotal * 100);

    // 1) Create Razorpay order FIRST (so we know its id before the DB row).
    //    If Razorpay fails we never write a half-baked order to the DB.
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

    const rzpOrder = await razorpay().orders.create({
      receipt: orderNumber,
      amount: amountInPaise,
      currency: "INR",
      notes: {
        guest_id: guestId,
        item_count: String(priced.totalQuantity),
      },
    });

    // 2) Persist the order, items, shipping, payment row in one transaction.
    const dbOrder = await createOrderWithItems({
      userId,
      guestId,
      shipping,
      pricedCart: priced,
      razorpayOrderId: rzpOrder.id,
      paymentMethod: "razorpay",
    });

    return ok(
      {
        razorpayOrderId: rzpOrder.id,
        amount: amountInPaise,
        currency: "INR",
        key: razorpayKeyId(),
        orderNumber: dbOrder.order_number,
        orderId: dbOrder.id,
        prefill: {
          name: `${shipping.first_name} ${shipping.last_name ?? ""}`.trim(),
          email: shipping.email,
          contact: shipping.phone,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    return handleError(err);
  }
}
