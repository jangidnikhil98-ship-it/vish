import "server-only";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { fail, handleError, ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import {
  getAdminCouponById,
  setAdminCouponActive,
} from "@/lib/queries/admin/coupons";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const statusSchema = z.object({ active: z.coerce.boolean() });

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const guard = await requireAdminApi();
    if (!guard.ok) return guard.response;

    const { id: idStr } = await ctx.params;
    const id = Number.parseInt(idStr, 10);
    if (!Number.isFinite(id)) return fail("Invalid coupon id", 400);

    const existing = await getAdminCouponById(id);
    if (!existing) return fail("Coupon not found", 404);

    const { active } = statusSchema.parse(await req.json());
    await setAdminCouponActive(id, active);

    return ok({ message: "Status updated successfully", active });
  } catch (err) {
    return handleError(err);
  }
}
