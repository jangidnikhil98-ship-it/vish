import type { NextRequest } from "next/server";
import { fail, handleError, ok } from "@/lib/api";
import { verifyPaymentSchema } from "@/lib/validators/checkout";
import { markOrderPaid } from "@/lib/queries/orders";
import { razorpay, verifyPaymentSignature } from "@/lib/razorpay";
import { notifyOrderPaid } from "@/lib/notifications/order";
import {
  createShiprocketOrderForOrder,
  shouldAutoCreateShiprocket,
} from "@/lib/notifications/shipping";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
 *   - On the first paid transition we also push the order to Shiprocket
 *     (the COD branch in /api/checkout/create-order does this directly,
 *     but prepaid orders only become eligible once the payment lands).
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

    if (!updated.wasAlreadyPaid) {
      void notifyOrderPaid({
        orderId: updated.orderId,
        razorpayPaymentId: razorpay_payment_id,
      });

      // Push to Shiprocket on first paid transition. Fire-and-forget — a
      // Shiprocket outage must not break the customer's "thank you" page.
      if (await shouldAutoCreateShiprocket()) {
        void createShiprocketOrderForOrder(updated.orderId, {
          paymentMethod: "Prepaid",
        }).catch((err) => {
          console.error("[shiprocket] prepaid push failed:", err);
        });
      }
    }

    return ok({ orderId: updated.orderId });
  } catch (err) {
    return handleError(err);
  }
}
