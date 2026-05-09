import "server-only";

import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";

/* ============================================================
   GENERIC KEY/VALUE STORE
   ============================================================ */

/**
 * Strongly-typed defaults for every key we know about. Used as the
 * fallback when the row is missing (e.g. fresh install before the
 * migration script ran) and as the schema for the admin Settings page.
 */
export const SETTING_DEFAULTS = {
  cod_enabled: "1",
  cod_fee: "50",
  cod_min_order_amount: "0",
  cod_max_order_amount: "20000",
  default_shipping_fee: "0",
  shiprocket_pickup_location: "Primary",
  shiprocket_default_weight_kg: "0.5",
  shiprocket_default_length_cm: "15",
  shiprocket_default_breadth_cm: "15",
  shiprocket_default_height_cm: "5",
  // Default = "0" → admin manually pushes each order from the order detail
  // page when it's actually ready to ship. Flip to "1" to push every order
  // to Shiprocket automatically the moment payment lands (or COD is placed).
  shiprocket_auto_create_order: "0",
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;

/**
 * `true` if the underlying error means the `site_settings` table doesn't
 * exist yet (migration not run). We swallow this everywhere so the app
 * keeps working with the seeded defaults — but we DO log it once per
 * process so an operator can spot the missing migration in logs.
 */
let warnedAboutMissingTable = false;
function isMissingTableError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; message?: string };
  if (e.code === "ER_NO_SUCH_TABLE") return true;
  return /site_settings.*doesn't exist|no such table|er_no_such_table/i.test(
    String(e.message ?? ""),
  );
}
function warnMissingTable(): void {
  if (warnedAboutMissingTable) return;
  warnedAboutMissingTable = true;
  console.warn(
    "[site_settings] table does not exist — falling back to default values. " +
      "Run `npm run db:migrate-coupons-cod` to create it.",
  );
}

export async function getSetting(key: SettingKey): Promise<string> {
  try {
    const [row] = await db
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(eq(siteSettings.key_name, key))
      .limit(1);
    return row?.value ?? SETTING_DEFAULTS[key];
  } catch (err) {
    if (isMissingTableError(err)) {
      warnMissingTable();
      return SETTING_DEFAULTS[key];
    }
    throw err;
  }
}

export async function getSettings<K extends SettingKey>(
  keys: readonly K[],
): Promise<Record<K, string>> {
  const result = {} as Record<K, string>;
  for (const k of keys) result[k] = SETTING_DEFAULTS[k];
  if (keys.length === 0) return result;

  try {
    const rows = await db
      .select({ key_name: siteSettings.key_name, value: siteSettings.value })
      .from(siteSettings);
    for (const r of rows) {
      if (r.key_name && (keys as readonly string[]).includes(r.key_name)) {
        result[r.key_name as K] = r.value ?? SETTING_DEFAULTS[r.key_name as K];
      }
    }
    return result;
  } catch (err) {
    if (isMissingTableError(err)) {
      warnMissingTable();
      // result is already pre-filled with defaults above
      return result;
    }
    throw err;
  }
}

export async function getAllSettings(): Promise<Record<SettingKey, string>> {
  return getSettings(Object.keys(SETTING_DEFAULTS) as readonly SettingKey[]);
}

export async function setSetting(key: SettingKey, value: string): Promise<void> {
  await db
    .insert(siteSettings)
    .values({
      key_name: key,
      value,
      created_at: sql`CURRENT_TIMESTAMP`,
      updated_at: sql`CURRENT_TIMESTAMP`,
    })
    .onDuplicateKeyUpdate({
      set: { value, updated_at: sql`CURRENT_TIMESTAMP` },
    });
}

export async function setSettings(
  values: Partial<Record<SettingKey, string>>,
): Promise<void> {
  for (const [k, v] of Object.entries(values)) {
    if (v !== undefined) await setSetting(k as SettingKey, v);
  }
}

/* ============================================================
   STRONGLY-TYPED HELPERS used elsewhere in the app
   ============================================================ */

export async function getCheckoutSettings(): Promise<{
  codEnabled: boolean;
  codFee: number;
  codMinOrderAmount: number;
  codMaxOrderAmount: number;
  defaultShippingFee: number;
}> {
  const s = await getSettings([
    "cod_enabled",
    "cod_fee",
    "cod_min_order_amount",
    "cod_max_order_amount",
    "default_shipping_fee",
  ]);
  return {
    codEnabled: s.cod_enabled === "1",
    codFee: Number(s.cod_fee) || 0,
    codMinOrderAmount: Number(s.cod_min_order_amount) || 0,
    codMaxOrderAmount: Number(s.cod_max_order_amount) || 0,
    defaultShippingFee: Number(s.default_shipping_fee) || 0,
  };
}

export async function getShiprocketSettings(): Promise<{
  pickupLocation: string;
  defaultWeightKg: number;
  defaultLengthCm: number;
  defaultBreadthCm: number;
  defaultHeightCm: number;
  autoCreateOrder: boolean;
}> {
  const s = await getSettings([
    "shiprocket_pickup_location",
    "shiprocket_default_weight_kg",
    "shiprocket_default_length_cm",
    "shiprocket_default_breadth_cm",
    "shiprocket_default_height_cm",
    "shiprocket_auto_create_order",
  ]);
  return {
    pickupLocation: s.shiprocket_pickup_location,
    defaultWeightKg: Number(s.shiprocket_default_weight_kg) || 0.5,
    defaultLengthCm: Number(s.shiprocket_default_length_cm) || 15,
    defaultBreadthCm: Number(s.shiprocket_default_breadth_cm) || 15,
    defaultHeightCm: Number(s.shiprocket_default_height_cm) || 5,
    autoCreateOrder: s.shiprocket_auto_create_order === "1",
  };
}
