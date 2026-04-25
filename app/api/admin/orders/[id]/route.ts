import "server-only";
import type { NextRequest } from "next/server";

import { fail, handleError, ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import { deleteAdminOrder, getAdminOrderById } from "@/lib/queries/admin/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const guard = await requireAdminApi();
    if (!guard.ok) return guard.response;

    const { id: idStr } = await ctx.params;
    const id = Number.parseInt(idStr, 10);
    if (!Number.isFinite(id)) return fail("Invalid order id", 400);

    const order = await getAdminOrderById(id);
    if (!order) return fail("Order not found", 404);

    await deleteAdminOrder(id);
    return ok({ message: "Order deleted successfully" });
  } catch (err) {
    return handleError(err);
  }
}
