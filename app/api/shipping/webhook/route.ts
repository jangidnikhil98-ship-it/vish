import "server-only";
import type { NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { shippingDetails } from "@/lib/db/schema";
import { fail, ok } from "@/lib/api";
import { verifyShiprocketWebhookToken } from "@/lib/shiprocket";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/shipping/webhook
 *
 * Shiprocket "Order Tracking" webhook receiver. Configure this URL in
 *    Shiprocket Dashboard → Settings → API → Configure Webhooks
 * with the static `X-Api-Key` header set to the same value as
 * `SHIPROCKET_WEBHOOK_TOKEN` in your .env.
 *
 * Payload shape (per Shiprocket docs):
 *   {
 *     "awb": "1234567890",
 *     "current_status": "DELIVERED",
 *     "current_timestamp": "2026-05-08 14:21:09",
 *     "courier_name": "Delhivery",
 *     "etd": "2026-05-09",
 *     "scans": [...]
 *   }
 *
 * We always return 200 (even on missing matches) so Shiprocket doesn't
 * retry forever; we log the row for visibility.
 */
export async function POST(req: NextRequest) {
  const headerToken =
    req.headers.get("x-api-key") ?? req.headers.get("x-shiprocket-token");

  if (!verifyShiprocketWebhookToken(headerToken)) {
    return fail("Invalid webhook token", 401);
  }

  let payload: ShiprocketWebhookPayload;
  try {
    payload = (await req.json()) as ShiprocketWebhookPayload;
  } catch {
    return fail("Invalid JSON", 400);
  }

  const awb = payload?.awb;
  const status = payload?.current_status ?? null;
  if (!awb) {
    return ok({ ignored: true, reason: "no awb" });
  }

  try {
    await db
      .update(shippingDetails)
      .set({
        tracking_status: status ? String(status).slice(0, 64) : null,
        tracking_updated_at: sql`CURRENT_TIMESTAMP`,
        updated_at: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(shippingDetails.awb_code, String(awb)));
  } catch (err) {
    console.error("[shiprocket-webhook] db update failed:", err);
    // still return 200 so Shiprocket doesn't retry
  }

  return ok({ awb, status });
}

interface ShiprocketWebhookPayload {
  awb?: string;
  current_status?: string;
  current_timestamp?: string;
  courier_name?: string;
  etd?: string;
  scans?: Array<{
    date?: string;
    activity?: string;
    location?: string;
    status?: string;
  }>;
}
