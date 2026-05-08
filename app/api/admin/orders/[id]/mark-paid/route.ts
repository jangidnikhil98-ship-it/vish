import "server-only";
import type { NextRequest } from "next/server";

import { fail, handleError, ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import { markCodOrderPaid } from "@/lib/queries/orders";
import { notifyOrderPlaced } from "@/lib/notifications/order";
import {
  createShiprocketOrderForOrder,
  shouldAutoCreateShiprocket,
} from "@/lib/notifications/shipping";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/orders/<id>/mark-paid
 *
 * Used by admin to confirm cash collection on COD orders. Flips
 *   orders.payment_status: pending → paid
 *   orders.status:         pending → processing
 *   payment_details.status: created → completed
 *
 * On the FIRST transition to paid we also:
 *   - send a "thanks for paying" notification to the customer (and admin)
 *   - push the order to Shiprocket if it isn't already there
 */
export async function POST(_req: NextRequest, ctx: Ctx) {
  try {
    const guard = await requireAdminApi();
    if (!guard.ok) return guard.response;

    const { id: idStr } = await ctx.params;
    const id = Number.parseInt(idStr, 10);
    if (!Number.isFinite(id)) return fail("Invalid order id", 400);

    const result = await markCodOrderPaid(id);
    if (!result) return fail("Order not found", 404);

    if (!result.wasAlreadyPaid) {
      // Fire-and-forget — admin shouldn't have to wait for email/SMS/SR.
      void notifyOrderPlaced({ orderId: id, paymentMethod: "razorpay" });
      if (await shouldAutoCreateShiprocket()) {
        void createShiprocketOrderForOrder(id, { paymentMethod: "Prepaid" }).catch(
          (err) =>
            console.error("[shiprocket] mark-paid push failed:", err),
        );
      }
    }

    return ok({
      message: result.wasAlreadyPaid
        ? "Order was already marked paid."
        : "Order marked as paid.",
      wasAlreadyPaid: result.wasAlreadyPaid,
    });
  } catch (err) {
    return handleError(err);
  }
}
