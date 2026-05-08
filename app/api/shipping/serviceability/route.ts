import "server-only";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { fail, handleError, ok } from "@/lib/api";
import { checkServiceability } from "@/lib/shiprocket";
import {
  getCheckoutSettings,
  getShiprocketSettings,
} from "@/lib/queries/admin/settings";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  pickupPincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Origin pincode must be 6 digits")
    .optional(),
  deliveryPincode: z.string().trim().regex(/^\d{6}$/, "PIN must be 6 digits"),
  /** "1" for COD, "0" for prepaid. */
  cod: z.coerce.number().refine((n) => n === 0 || n === 1, "0 or 1"),
  /** Optional weight in kg; falls back to default site setting. */
  weight: z.coerce.number().min(0).optional(),
  declaredValue: z.coerce.number().min(0).optional(),
});

/**
 * GET /api/shipping/serviceability?deliveryPincode=400001&cod=1
 *
 * Used by the storefront checkout to:
 *   - grey out the COD radio for non-COD pincodes
 *   - show "Delivery in N days" hint
 *   - quote a live shipping rate (when desired)
 *
 * No auth required — any visitor can check a PIN.
 */
export async function GET(req: NextRequest) {
  try {
    // Each Shiprocket serviceability call costs us a real upstream request,
    // so rate-limit the public endpoint aggressively. 60 calls/min/IP is
    // way more than a real customer typing a PIN code generates.
    const ip = rateLimitKey(req);
    const limit = rateLimit(`serviceability:${ip}`, {
      limit: 60,
      windowMs: 60_000,
    });
    if (!limit.ok) {
      return fail("Too many requests", 429);
    }

    const url = new URL(req.url);
    const parsed = querySchema.safeParse({
      pickupPincode: url.searchParams.get("pickupPincode") ?? undefined,
      deliveryPincode: url.searchParams.get("deliveryPincode") ?? "",
      cod: url.searchParams.get("cod") ?? "0",
      weight: url.searchParams.get("weight") ?? undefined,
      declaredValue: url.searchParams.get("declaredValue") ?? undefined,
    });
    if (!parsed.success) {
      return fail("Invalid query", 422, {
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const checkoutSettings = await getCheckoutSettings();
    const sr = await getShiprocketSettings();

    // The pickup pincode normally lives in the Shiprocket dashboard's pickup
    // location, but Shiprocket also accepts the raw pincode for serviceability
    // checks. We default to env (SHIPROCKET_PICKUP_PINCODE) if set.
    const pickup =
      parsed.data.pickupPincode ??
      process.env.SHIPROCKET_PICKUP_PINCODE ??
      "";

    if (!pickup) {
      return fail(
        "Set SHIPROCKET_PICKUP_PINCODE in environment, or pass pickupPincode in the query.",
        500,
      );
    }

    const result = await checkServiceability({
      pickupPincode: pickup,
      deliveryPincode: parsed.data.deliveryPincode,
      cod: parsed.data.cod === 1 ? 1 : 0,
      weight: parsed.data.weight ?? sr.defaultWeightKg,
      declaredValue: parsed.data.declaredValue,
    });

    return ok({
      serviceable: result.serviceable,
      codAvailable: result.codAvailable && checkoutSettings.codEnabled,
      cheapestRate: result.cheapestRate,
      estimatedDays: result.estimatedDays,
      courierCompanyId: result.courierCompanyId,
      courierName: result.courierName,
    });
  } catch (err) {
    return handleError(err);
  }
}
