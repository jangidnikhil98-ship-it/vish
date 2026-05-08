import "server-only";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { fail, handleError, ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import {
  couponCodeExists,
  createAdminCoupon,
} from "@/lib/queries/admin/coupons";
import { adminCouponCreateSchema } from "@/lib/validators/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const guard = await requireAdminApi();
    if (!guard.ok) return guard.response;

    const body = await req.json().catch(() => ({}));
    const parsed = adminCouponCreateSchema.parse(body);

    if (await couponCodeExists(parsed.code)) {
      return fail("That coupon code already exists.", 422, {
        errors: { code: ["A coupon with this code already exists."] },
      });
    }

    const id = await createAdminCoupon({
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

    return ok({ id, message: "Coupon created successfully." });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return fail("Validation failed", 422, {
        errors: err.flatten().fieldErrors,
      });
    }
    return handleError(err);
  }
}
