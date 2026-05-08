import type { NextRequest } from "next/server";

import { fail, handleError, ok } from "@/lib/api";
import { applyCouponSchema } from "@/lib/validators/checkout";
import { priceCart } from "@/lib/queries/orders";
import { resolveCoupon } from "@/lib/queries/admin/coupons";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/checkout/apply-coupon
 *
 * Body: { code, items, paymentMethod }
 *
 * Validates the coupon against the cart subtotal SERVER-SIDE (we don't
 * trust the client's idea of subtotal). Returns the discount amount
 * the client should display in the order summary.
 *
 * The actual discount is RECOMPUTED on the server again at create-order
 * time, so this endpoint cannot be used to spoof a discount.
 */
export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = applyCouponSchema.safeParse(json);
    if (!parsed.success) {
      return fail("Invalid request", 422, {
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const priced = await priceCart(parsed.data.items);
    if (!priced) {
      return fail(
        "Some items in your cart are no longer available. Please refresh and try again.",
        409,
      );
    }
    if (priced.subtotal <= 0) {
      return fail("Cart total must be greater than zero", 400);
    }

    const result = await resolveCoupon({
      code: parsed.data.code,
      subtotal: priced.subtotal,
      paymentMethod: parsed.data.paymentMethod,
    });

    if (!result.ok) {
      return fail(result.message, 422);
    }

    return ok({
      code: result.coupon.code,
      type: result.coupon.type,
      discountAmount: result.discountAmount,
      freeShipping: result.freeShipping,
      message: result.message,
      subtotal: priced.subtotal,
    });
  } catch (err) {
    return handleError(err);
  }
}
