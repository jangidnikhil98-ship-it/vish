import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { markOrderFailed, markOrderPaid } from "@/lib/queries/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/payment/webhook
 *
 * Razorpay webhook receiver. Mirrors PaymentController::webhook.
 *
 * IMPORTANT: We read the raw request body (not `req.json()`) because the
 * HMAC signature must be computed against the exact bytes that Razorpay
 * sent. Any reformatting (whitespace etc.) would break verification.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json(
      { success: false, error: "Invalid webhook signature" },
      { status: 401 },
    );
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  try {
    const event = payload?.event;
    const entity = payload?.payload?.payment?.entity;
    if (!entity?.order_id) {
      return NextResponse.json({ success: true, ignored: true });
    }

    const rawEntity = JSON.stringify(entity);

    switch (event) {
      case "payment.captured":
      case "payment.authorized":
        if (entity.id) {
          await markOrderPaid({
            razorpayOrderId: entity.order_id,
            razorpayPaymentId: entity.id,
            rawPaymentJson: rawEntity,
          });
        }
        break;
      case "payment.failed":
        await markOrderFailed(entity.order_id, rawEntity);
        break;
      default:
        // Acknowledge unknown events so Razorpay doesn't retry forever.
        break;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[webhook] error:", err);
    return NextResponse.json(
      { success: false, error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

type WebhookPayload = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        status?: string;
      };
    };
  };
};
