import type { NextRequest } from "next/server";

import { fail, handleError, ok } from "@/lib/api";
import { applyCouponSchema } from "@/lib/validators/checkout";
import { priceCart } from "@/lib/queries/orders";
import { resolveCoupon } from "@/lib/queries/admin/coupons";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Generic message we return for ANY rejection — invalid code, expired,
 * over usage limit, doesn't meet min order, not yet active. Returning
 * distinct error reasons would let an attacker probe for the existence
 * of codes and read off each one's min_order_amount.
 *
 * (We still log the real reason server-side via rate-limit telemetry.)
 */
const GENERIC_REJECTION = "This coupon code is invalid or no longer eligible.";

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
    // Brute-force probing protection — 30 attempts/hour/IP. Combined with
    // the generic rejection message above this makes mass-discovering live
    // codes (and their min_order thresholds) unattractive.
    const ip = rateLimitKey(req);
    const limit = rateLimit(`coupon:${ip}`, {
      limit: 30,
      windowMs: 60 * 60_000,
    });
    if (!limit.ok) {
      return fail(
        "Too many coupon attempts. Please wait a few minutes.",
        429,
      );
    }

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
      // Log the specific reason for the operator's benefit, return generic.
      console.info(
        "[apply-coupon] reject",
        parsed.data.code,
        "→",
        result.message,
      );
      return fail(GENERIC_REJECTION, 422);
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
