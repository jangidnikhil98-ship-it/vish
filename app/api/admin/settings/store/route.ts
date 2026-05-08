import "server-only";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { fail, handleError, ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import { adminSettingsKVSchema } from "@/lib/validators/admin";
import { setSettings } from "@/lib/queries/admin/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/settings/store
 *
 * Updates the storefront-wide settings (COD fee, Shiprocket pickup, etc.)
 * stored in the `site_settings` key/value table.
 */
export async function POST(req: NextRequest) {
  try {
    const guard = await requireAdminApi();
    if (!guard.ok) return guard.response;

    const body = await req.json().catch(() => ({}));
    const parsed = adminSettingsKVSchema.parse(body);

    await setSettings({
      cod_enabled: String(parsed.cod_enabled),
      cod_fee: String(parsed.cod_fee),
      cod_min_order_amount: String(parsed.cod_min_order_amount),
      cod_max_order_amount: String(parsed.cod_max_order_amount),
      default_shipping_fee: String(parsed.default_shipping_fee),
      shiprocket_pickup_location: parsed.shiprocket_pickup_location,
      shiprocket_default_weight_kg: String(parsed.shiprocket_default_weight_kg),
      shiprocket_default_length_cm: String(parsed.shiprocket_default_length_cm),
      shiprocket_default_breadth_cm: String(parsed.shiprocket_default_breadth_cm),
      shiprocket_default_height_cm: String(parsed.shiprocket_default_height_cm),
      shiprocket_auto_create_order: String(parsed.shiprocket_auto_create_order),
    });

    return ok({ message: "Store settings updated successfully." });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return fail("Validation failed", 422, {
        errors: err.flatten().fieldErrors,
      });
    }
    return handleError(err);
  }
}
