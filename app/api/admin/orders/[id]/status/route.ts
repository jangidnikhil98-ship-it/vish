import "server-only";
import type { NextRequest } from "next/server";

import { fail, handleError, ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import {
  getAdminOrderById,
  setAdminOrderStatus,
} from "@/lib/queries/admin/orders";
import { adminOrderStatusSchema } from "@/lib/validators/admin";
import { cancelOrderRestoring } from "@/lib/queries/orders";
import { cancelShiprocketOrderForOrder } from "@/lib/notifications/shipping";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const guard = await requireAdminApi();
    if (!guard.ok) return guard.response;

    const { id: idStr } = await ctx.params;
    const id = Number.parseInt(idStr, 10);
    if (!Number.isFinite(id)) return fail("Invalid order id", 400);

    const order = await getAdminOrderById(id);
    if (!order) return fail("Order not found", 404);

    const body = await req.json();
    const { status } = adminOrderStatusSchema.parse(body);

    // Special handling when the admin cancels:
    //   - Restore product stock and unwind coupon redemption.
    //   - Tell Shiprocket to cancel the courier booking (if any).
    if (status === "cancelled" && order.status !== "cancelled") {
      await cancelOrderRestoring(id);
      // Fire-and-forget — admin doesn't need to wait for SR's API.
      void cancelShiprocketOrderForOrder(id).catch((err) => {
        console.error("[shiprocket] cancel failed for order", id, err);
      });
    } else {
      await setAdminOrderStatus(id, status);
    }

    return ok({ message: "Order status updated", status });
  } catch (err) {
    return handleError(err);
  }
}
