import "server-only";
import type { NextRequest } from "next/server";

import { fail, handleError, ok } from "@/lib/api";
import { trackByAwb } from "@/lib/shiprocket";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ awb: string }>;
}

/**
 * GET /api/shipping/track/<AWB>
 *
 * Lightweight pass-through to Shiprocket's tracking API so the customer-facing
 * /track/<awb> page can render shipment status without leaking auth tokens.
 */
export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { awb } = await ctx.params;
    const code = String(awb || "").trim();
    if (!/^[A-Za-z0-9_-]{6,32}$/.test(code)) {
      return fail("Invalid AWB code", 400);
    }
    const result = await trackByAwb(code);
    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}
