import "server-only";
import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";

import { fail, handleError, ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import { getAdminOrderById } from "@/lib/queries/admin/orders";
import { createShiprocketOrderForOrder } from "@/lib/notifications/shipping";
import { ShiprocketError } from "@/lib/shiprocket";
import { db } from "@/lib/db";
import { shippingDetails } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/orders/<id>/push-shiprocket
 *
 * Admin-triggered push of an order to Shiprocket.
 *
 * Used when `shiprocket_auto_create_order` is "0" (the default) — admin
 * marks the order as "ready to ship" by hitting this endpoint, and we
 * create the Shiprocket order + assign an AWB.
 *
 * Idempotent: if the order is already in Shiprocket (has a
 * shiprocket_order_id) we no-op and return the existing IDs.
 *
 * Refuses to push:
 *   - Cancelled orders
 *   - Unpaid prepaid orders (must be paid via Razorpay first)
 *   - Orders without a complete shipping address
 */
export async function POST(_req: NextRequest, ctx: Ctx) {
  try {
    const guard = await requireAdminApi();
    if (!guard.ok) return guard.response;

    const { id: idStr } = await ctx.params;
    const id = Number.parseInt(idStr, 10);
    if (!Number.isFinite(id)) return fail("Invalid order id", 400);

    const order = await getAdminOrderById(id);
    if (!order) return fail("Order not found", 404);

    if (order.status === "cancelled") {
      return fail("This order is cancelled — nothing to ship.", 400);
    }

    // Prepaid orders should be paid before we book a courier; COD is fine
    // to push at any time (the courier collects on delivery).
    if (
      order.payment_method !== "cod" &&
      order.payment_status !== "paid"
    ) {
      return fail(
        "This online-payment order hasn't been paid yet. Wait for payment to complete or mark it paid first.",
        400,
      );
    }

    if (
      !order.shipping?.address ||
      !order.shipping.city ||
      !order.shipping.pincode ||
      !order.shipping.phone
    ) {
      return fail(
        "The shipping address is incomplete (street / city / pincode / phone required). Please ask the customer to update it.",
        422,
      );
    }

    // Idempotent — already pushed.
    const [existing] = await db
      .select({
        shiprocketOrderId: shippingDetails.shiprocket_order_id,
        awbCode: shippingDetails.awb_code,
      })
      .from(shippingDetails)
      .where(eq(shippingDetails.order_id, id))
      .limit(1);
    if (existing?.shiprocketOrderId) {
      return ok({
        message: "Order is already in Shiprocket.",
        alreadyPushed: true,
        shiprocketOrderId: existing.shiprocketOrderId,
        awbCode: existing.awbCode,
      });
    }

    try {
      const res = await createShiprocketOrderForOrder(id, {
        paymentMethod: order.payment_method === "cod" ? "COD" : "Prepaid",
      });
      if (!res) {
        return ok({
          message: "Order is already in Shiprocket.",
          alreadyPushed: true,
        });
      }
      return ok({
        message: res.awbCode
          ? `Order pushed to Shiprocket and AWB assigned: ${res.awbCode}`
          : "Order pushed to Shiprocket. AWB will be assigned shortly.",
        shiprocketOrderId: res.shiprocketOrderId,
        shipmentId: res.shipmentId,
        awbCode: res.awbCode,
      });
    } catch (err) {
      if (err instanceof ShiprocketError) {
        // Surface the specific Shiprocket message so the admin can
        // understand why (e.g. "Pickup location 'Primary' not found").
        return fail(`Shiprocket error: ${err.message}`, 502);
      }
      throw err;
    }
  } catch (err) {
    return handleError(err);
  }
}
