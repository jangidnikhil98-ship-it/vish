import "server-only";

import { getOrderForNotification } from "@/lib/queries/orders";
import {
  sendAdminOrderNotification,
  sendOrderConfirmation,
} from "@/lib/email";
import {
  sendAdminOrderWhatsApp,
  sendCustomerOrderWhatsApp,
} from "@/lib/whatsapp";
import { siteUrl } from "@/lib/site-url";

/**
 * Fan out post-checkout notifications (customer email, admin email, admin
 * WhatsApp, optional customer WhatsApp). Used by:
 *   - verify-payment (Razorpay) on first transition to paid
 *   - payment/webhook (Razorpay) on first transition to paid
 *   - create-order (COD) immediately after the order is persisted
 *   - admin mark-as-paid (COD → paid)
 *
 * Never throws — every leg is independently caught so a flaky email or
 * WhatsApp gateway can't break the others.
 *
 * Lives in `lib/` (not in a `route.ts`) because Next.js App Router does not
 * sanction arbitrary cross-route imports.
 */
export async function notifyOrderPlaced(params: {
  orderId: number;
  /** "razorpay" → "Order confirmed" wording. "cod" → "Pay on delivery". */
  paymentMethod: "razorpay" | "cod";
  /** Only set when paymentMethod = "razorpay". */
  razorpayPaymentId?: string | null;
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

  const breakdown = {
    subtotal: order.subtotal,
    discountAmount: order.discountAmount,
    couponCode: order.couponCode,
    shippingFee: order.shippingFee,
    codFee: order.codFee,
  };

  if (order.customerEmail) {
    try {
      await sendOrderConfirmation({
        to: order.customerEmail,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        totalAmount: order.totalAmount,
        items,
        shipping: order.shipping,
        paymentId: params.razorpayPaymentId ?? null,
        paymentMethod: params.paymentMethod,
        breakdown,
      });
    } catch (err) {
      console.error("[notify] customer email failed:", err);
    }
  }

  try {
    await sendAdminOrderNotification({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      totalAmount: order.totalAmount,
      items,
      shipping: order.shipping,
      paymentId: params.razorpayPaymentId ?? null,
      paymentMethod: params.paymentMethod,
      adminUrl: `${siteUrl()}/admin/orders`,
    });
  } catch (err) {
    console.error("[notify] admin email failed:", err);
  }

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

/**
 * Backwards-compatible alias for the Razorpay paths (verify-payment +
 * webhook). New code should call `notifyOrderPlaced` directly.
 */
export async function notifyOrderPaid(params: {
  orderId: number;
  razorpayPaymentId: string;
}): Promise<void> {
  return notifyOrderPlaced({
    orderId: params.orderId,
    paymentMethod: "razorpay",
    razorpayPaymentId: params.razorpayPaymentId,
  });
}
