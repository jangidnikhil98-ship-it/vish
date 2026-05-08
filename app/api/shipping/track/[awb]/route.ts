import "server-only";
import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";

import { fail, handleError, ok } from "@/lib/api";
import { trackByAwb } from "@/lib/shiprocket";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { shippingDetails } from "@/lib/db/schema";
import { readSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ awb: string }>;
}

/**
 * GET /api/shipping/track/<AWB>?email=<order-email>
 *
 * Returns Shiprocket's tracking timeline for the given AWB.
 *
 * Access control:
 *   - Logged-in user whose order owns this AWB → always allowed.
 *   - Anonymous: must pass `?email=<address-on-the-order>`. Without it,
 *     the response is a generic 404 so the AWB itself can't be used as a
 *     bearer token to spy on someone else's parcel route + recipient name.
 *   - Per-IP rate limit (30/min) — keeps Shiprocket call costs sane.
 */
export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const ip = rateLimitKey(req);
    const limit = rateLimit(`track:${ip}`, {
      limit: 30,
      windowMs: 60_000,
    });
    if (!limit.ok) {
      return fail("Too many requests", 429);
    }

    const { awb } = await ctx.params;
    const code = String(awb || "").trim();
    if (!/^[A-Za-z0-9_-]{6,32}$/.test(code)) {
      return fail("Invalid AWB code", 400);
    }

    // Look up which order owns this AWB. Treat unknown AWB as 404 — never
    // forward to Shiprocket without authorisation, otherwise an attacker
    // could enumerate AWBs and read each parcel's destination.
    const [shipping] = await db
      .select({
        orderId: shippingDetails.order_id,
        userId: shippingDetails.user_id,
        email: shippingDetails.email,
      })
      .from(shippingDetails)
      .where(eq(shippingDetails.awb_code, code))
      .limit(1);

    if (!shipping) {
      return fail("Tracking not available", 404);
    }

    const session = await readSession();
    const isOwner =
      session?.sub != null &&
      shipping.userId != null &&
      Number(shipping.userId) === session.sub;

    if (!isOwner) {
      // Require ?email= match for anonymous look-ups.
      const url = new URL(req.url);
      const askedEmail = (url.searchParams.get("email") ?? "")
        .trim()
        .toLowerCase();
      const orderEmail = (shipping.email ?? "").trim().toLowerCase();
      if (!askedEmail || askedEmail !== orderEmail) {
        return fail("Tracking not available", 404);
      }
    }

    const result = await trackByAwb(code);
    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}
