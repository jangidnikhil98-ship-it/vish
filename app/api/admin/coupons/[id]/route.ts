import "server-only";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { fail, handleError, ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import {
  couponCodeExists,
  deleteAdminCoupon,
  getAdminCouponById,
  updateAdminCoupon,
} from "@/lib/queries/admin/coupons";
import { adminCouponCreateSchema } from "@/lib/validators/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const guard = await requireAdminApi();
    if (!guard.ok) return guard.response;

    const { id: idStr } = await ctx.params;
    const id = Number.parseInt(idStr, 10);
    if (!Number.isFinite(id)) return fail("Invalid coupon id", 400);

    const existing = await getAdminCouponById(id);
    if (!existing) return fail("Coupon not found", 404);

    const body = await req.json().catch(() => ({}));
    const parsed = adminCouponCreateSchema.parse(body);

    // Code uniqueness — only check if code actually changed.
    if (parsed.code !== existing.code) {
      if (await couponCodeExists(parsed.code, id)) {
        return fail("That coupon code already exists.", 422, {
          errors: { code: ["A coupon with this code already exists."] },
        });
      }
    }

    await updateAdminCoupon(id, {
      code: parsed.code,
      type: parsed.type,
      value: parsed.value,
      min_order_amount: parsed.min_order_amount ?? 0,
      max_discount_amount: parsed.max_discount_amount ?? null,
      usage_limit: parsed.usage_limit ?? null,
      description: parsed.description ?? "",
      valid_from: parsed.valid_from ?? null,
      valid_until: parsed.valid_until ?? null,
      is_active: parsed.is_active === 1 ? 1 : 0,
    });

    return ok({ message: "Coupon updated successfully." });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return fail("Validation failed", 422, {
        errors: err.flatten().fieldErrors,
      });
    }
    return handleError(err);
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const guard = await requireAdminApi();
    if (!guard.ok) return guard.response;

    const { id: idStr } = await ctx.params;
    const id = Number.parseInt(idStr, 10);
    if (!Number.isFinite(id)) return fail("Invalid coupon id", 400);

    const existing = await getAdminCouponById(id);
    if (!existing) return fail("Coupon not found", 404);

    await deleteAdminCoupon(id);
    return ok({ message: "Coupon deleted successfully." });
  } catch (err) {
    return handleError(err);
  }
}
