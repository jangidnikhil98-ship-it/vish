import "server-only";
import type { NextRequest } from "next/server";

import { fail, handleError, ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import {
  getAdminOrderById,
  setAdminOrderStatus,
} from "@/lib/queries/admin/orders";
import { adminOrderStatusSchema } from "@/lib/validators/admin";

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
    await setAdminOrderStatus(id, status);

    return ok({ message: "Order status updated", status });
  } catch (err) {
    return handleError(err);
  }
}
