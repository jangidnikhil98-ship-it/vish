import type { NextRequest } from "next/server";
import { fail, handleError, ok } from "@/lib/api";
import { verifyPaymentSchema } from "@/lib/validators/checkout";
import {
  getOrderForNotification,
  markOrderPaid,
} from "@/lib/queries/orders";
import { razorpay, verifyPaymentSignature } from "@/lib/razorpay";
import {
  sendAdminOrderNotification,
  sendOrderConfirmation,
} from "@/lib/email";
import {
  sendAdminOrderWhatsApp,
  sendCustomerOrderWhatsApp,
} from "@/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

/**
 * POST /api/checkout/verify-payment
 *
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 *
 * Bug fixes vs PaymentController::success:
 *   - Cryptographically verifies the Razorpay signature (the original
 *     route trusted any caller who knew the order_id + payment_id pair).
 *   - Even after signature verification we re-fetch the payment from
 *     Razorpay's API and assert status ∈ {authorized, captured} — same
 *     defence-in-depth as the original.
 *   - Order confirmation email + admin alert + WhatsApp notification fire
 *     here. They are deduped against the webhook by checking
 *     `wasAlreadyPaid`, so the customer never gets two confirmation
 *     emails even if both code paths run.
 */
export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = verifyPaymentSchema.safeParse(json);
    if (!parsed.success) {
      return fail("Invalid payment payload", 422, {
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = parsed.data;

    if (
      !verifyPaymentSignature({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      })
    ) {
      return fail("Payment signature verification failed", 400);
    }

    // Belt-and-braces: also fetch from Razorpay to read the live status.
    const payment = await razorpay().payments.fetch(razorpay_payment_id);
    if (
      payment.status !== "authorized" &&
      payment.status !== "captured"
    ) {
      return fail(`Payment not successful (status=${payment.status})`, 400);
    }

    const updated = await markOrderPaid({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      rawPaymentJson: JSON.stringify(payment),
    });

    if (!updated) {
      return fail("Order record not found for this payment", 404);
    }

    // Fire-and-forget notifications (email + WhatsApp). Run only when this
    // is the first time we're marking the order as paid — prevents duplicates
    // when the webhook also fires for the same payment.
    if (!updated.wasAlreadyPaid) {
      void notifyOrderPaid({
        orderId: updated.orderId,
        razorpayPaymentId: razorpay_payment_id,
      });
    }

    return ok({ orderId: updated.orderId });
  } catch (err) {
    return handleError(err);
  }
}

/**
 * Send all post-payment notifications (customer email, admin email, admin
 * WhatsApp, optional customer WhatsApp). Wrapped in a single helper so
 * both the verify-payment route and the webhook can call it.
 *
 * Never throws — every leg is independently caught so a flaky email or
 * WhatsApp gateway can't break the others.
 */
export async function notifyOrderPaid(params: {
  orderId: number;
  razorpayPaymentId: string;
}): Promise<void> {
  let order;
  try {
    order = await getOrderForNotification(params.orderId);
  } catch (err) {
    console.error("[notify] failed to load order:", err);
    return;
  }
  if (!order) {
    console.warn("[notify] order not found for id", params.orderId);
    return;
  }

  const items = order.items.map((it) => ({
    name: it.name,
    quantity: it.quantity,
    price: it.price,
    size: it.size,
    variation: it.variation,
    giftWrap: it.giftWrap,
  }));

  // 1) Customer order confirmation email
  if (order.customerEmail) {
    try {
      await sendOrderConfirmation({
        to: order.customerEmail,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        totalAmount: order.totalAmount,
        items,
        shipping: order.shipping,
        paymentId: params.razorpayPaymentId,
      });
    } catch (err) {
      console.error("[notify] customer email failed:", err);
    }
  }

  // 2) Admin order received email
  try {
    await sendAdminOrderNotification({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      totalAmount: order.totalAmount,
      items,
      shipping: order.shipping,
      paymentId: params.razorpayPaymentId,
      adminUrl: `${SITE_URL}/admin/orders`,
    });
  } catch (err) {
    console.error("[notify] admin email failed:", err);
  }

  // 3) Admin WhatsApp alert
  try {
    await sendAdminOrderWhatsApp({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      totalAmount: order.totalAmount,
      items,
      shippingCity: order.shipping?.city ?? null,
      shippingPincode: order.shipping?.pincode ?? null,
    });
  } catch (err) {
    console.error("[notify] admin WhatsApp failed:", err);
  }

  // 4) Customer WhatsApp confirmation (best-effort — only if they gave a
  //    phone number and a provider is configured).
  if (order.customerPhone) {
    try {
      await sendCustomerOrderWhatsApp({
        to: order.customerPhone,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        totalAmount: order.totalAmount,
      });
    } catch (err) {
      console.error("[notify] customer WhatsApp failed:", err);
    }
  }
}
