import type { NextRequest } from "next/server";
import { fail, handleError, ok } from "@/lib/api";
import { verifyPaymentSchema } from "@/lib/validators/checkout";
import { markOrderPaid } from "@/lib/queries/orders";
import { razorpay, verifyPaymentSignature } from "@/lib/razorpay";
import { sendOrderConfirmation } from "@/lib/email";

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
 *   - Order confirmation email now degrades gracefully when no email is
 *     on file or SMTP isn't configured (the original would 500).
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

    if (updated.email) {
      try {
        await sendOrderConfirmation({
          to: updated.email,
          orderNumber: razorpay_order_id,
          customerName: updated.email,
          totalAmount: Number(payment.amount) / 100,
          items: [],
        });
      } catch (mailErr) {
        // Never fail the checkout because of email problems.
        console.error("[checkout] order-confirmation email failed:", mailErr);
      }
    }

    return ok({ orderId: updated.orderId });
  } catch (err) {
    return handleError(err);
  }
}
