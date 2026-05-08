import "server-only";

/**
 * Shiprocket REST client (https://apiv2.shiprocket.in).
 *
 * Pattern mirrors `lib/razorpay.ts`:
 *   - lazy auth (no env validation at import time so `next build` doesn't fail)
 *   - in-memory token cache (Shiprocket tokens live ~10 days, but we
 *     re-auth every 9 days defensively)
 *   - every helper accepts an explicit shape so callers don't depend on
 *     Shiprocket's raw JSON
 *
 * Required env vars (set in `.env` AND on the production server):
 *   SHIPROCKET_EMAIL
 *   SHIPROCKET_PASSWORD
 *   SHIPROCKET_WEBHOOK_TOKEN     (for /api/shipping/webhook auth)
 *
 * Optional pickup-location override:
 *   SHIPROCKET_PICKUP_LOCATION   — falls back to site_settings.shiprocket_pickup_location
 */

const BASE_URL = "https://apiv2.shiprocket.in/v1/external";

/* ============================================================
   AUTH (token cache)
   ============================================================ */

interface CachedToken {
  token: string;
  /** Unix ms when we should re-auth. */
  refreshAt: number;
}

let _tokenCache: CachedToken | null = null;
const TOKEN_TTL_MS = 9 * 24 * 60 * 60 * 1000; // 9 days

function readEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v.trim();
}

/** Force a fresh auth on next call (used after a 401 from any helper). */
export function clearShiprocketToken(): void {
  _tokenCache = null;
}

async function getToken(): Promise<string> {
  if (_tokenCache && Date.now() < _tokenCache.refreshAt) {
    return _tokenCache.token;
  }

  const email = readEnv("SHIPROCKET_EMAIL");
  const password = readEnv("SHIPROCKET_PASSWORD");

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ShiprocketError(
      `Shiprocket auth failed (${res.status}): ${text || res.statusText}`,
      res.status,
    );
  }
  const json = (await res.json()) as { token?: string };
  if (!json.token) {
    throw new ShiprocketError("Shiprocket auth returned no token", 502);
  }
  _tokenCache = { token: json.token, refreshAt: Date.now() + TOKEN_TTL_MS };
  return json.token;
}

/* ============================================================
   ERROR
   ============================================================ */

export class ShiprocketError extends Error {
  status: number;
  body?: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ShiprocketError";
    this.status = status;
    this.body = body;
  }
}

/* ============================================================
   LOW-LEVEL FETCH WRAPPER
   ============================================================ */

async function srFetch<T>(
  path: string,
  init: { method: "GET" | "POST"; body?: unknown },
): Promise<T> {
  const doFetch = async (token: string) =>
    fetch(`${BASE_URL}${path}`, {
      method: init.method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });

  let token = await getToken();
  let res = await doFetch(token);

  // Re-auth once on 401 (token expired between requests).
  if (res.status === 401) {
    clearShiprocketToken();
    token = await getToken();
    res = await doFetch(token);
  }

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }

  if (!res.ok) {
    const msg =
      (json && typeof json === "object" && "message" in json
        ? String((json as { message: unknown }).message)
        : null) ??
      (typeof json === "string" ? json : null) ??
      `Shiprocket ${path} failed: ${res.status} ${res.statusText}`;
    throw new ShiprocketError(msg, res.status, json);
  }
  return json as T;
}

/* ============================================================
   1) SERVICEABILITY  —  "is this PIN deliverable / COD-eligible?"
   ============================================================ */

export interface ServiceabilityParams {
  /** Origin pickup pincode (your warehouse). */
  pickupPincode: string;
  /** Customer delivery pincode. */
  deliveryPincode: string;
  /** "1" for COD, "0" for prepaid. Affects which couriers reply. */
  cod: 0 | 1;
  /** Shipment weight in kg (Shiprocket needs this). */
  weight: number;
  /** Optional declared cart value (rupees). */
  declaredValue?: number;
}

export interface ServiceabilityResult {
  /** True if any courier serves this pincode under the requested mode. */
  serviceable: boolean;
  /** True if any returned courier offers COD on this route. */
  codAvailable: boolean;
  /** Cheapest available rate (INR) across couriers (incl. COD charges). */
  cheapestRate: number | null;
  /** Estimated delivery in days (best of all couriers). */
  estimatedDays: number | null;
  /** Recommended courier id (Shiprocket "courier_company_id"). */
  courierCompanyId: number | null;
  /** Recommended courier name (display only). */
  courierName: string | null;
  /** Raw response object (for debugging in dev). */
  raw?: unknown;
}

interface SrServiceabilityCourier {
  courier_company_id: number;
  courier_name: string;
  rate: number;
  cod: number; // 0 or 1
  estimated_delivery_days?: string | number;
  etd?: string;
  is_surface?: boolean;
}

interface SrServiceabilityResponse {
  status: number;
  data?: {
    available_courier_companies?: SrServiceabilityCourier[];
    recommended_courier_company_id?: number;
  };
}

export async function checkServiceability(
  p: ServiceabilityParams,
): Promise<ServiceabilityResult> {
  const qs = new URLSearchParams({
    pickup_postcode: p.pickupPincode,
    delivery_postcode: p.deliveryPincode,
    cod: String(p.cod),
    weight: p.weight.toString(),
  });
  if (p.declaredValue !== undefined) {
    qs.set("declared_value", p.declaredValue.toString());
  }

  let res: SrServiceabilityResponse;
  try {
    res = await srFetch<SrServiceabilityResponse>(
      `/courier/serviceability/?${qs.toString()}`,
      { method: "GET" },
    );
  } catch (err) {
    // Treat any Shiprocket failure as "not serviceable" rather than
    // crashing the checkout — the user can still pay online.
    console.error("[shiprocket] serviceability error:", err);
    return {
      serviceable: false,
      codAvailable: false,
      cheapestRate: null,
      estimatedDays: null,
      courierCompanyId: null,
      courierName: null,
    };
  }

  const couriers = res.data?.available_courier_companies ?? [];
  if (couriers.length === 0) {
    return {
      serviceable: false,
      codAvailable: false,
      cheapestRate: null,
      estimatedDays: null,
      courierCompanyId: null,
      courierName: null,
      raw: res,
    };
  }

  // Sort by cheapest rate, prefer recommended if it's in the cheap top 3.
  const byRate = [...couriers].sort((a, b) => a.rate - b.rate);
  const recommended = couriers.find(
    (c) => c.courier_company_id === res.data?.recommended_courier_company_id,
  );
  const top = recommended ?? byRate[0];

  const codAvailable = couriers.some((c) => c.cod === 1);
  const cheapest = byRate[0].rate;
  const days =
    Number.parseInt(String(top.estimated_delivery_days ?? ""), 10) || null;

  return {
    serviceable: true,
    codAvailable,
    cheapestRate: Math.round(cheapest * 100) / 100,
    estimatedDays: Number.isFinite(days) ? days : null,
    courierCompanyId: top.courier_company_id,
    courierName: top.courier_name,
    raw: process.env.NODE_ENV === "development" ? res : undefined,
  };
}

/* ============================================================
   2) CREATE ORDER  —  push our placed order into Shiprocket
   ============================================================ */

export interface CreateOrderParams {
  /** Our internal order number (e.g. ORD-XYZ). */
  orderId: string;
  /** ISO date "YYYY-MM-DD". */
  orderDate: string;
  /** Pickup nickname (must match Settings → Pickup Addresses). */
  pickupLocation: string;
  /** "Prepaid" or "COD". */
  paymentMethod: "Prepaid" | "COD";
  /** "true" or "false". */
  isAutoCreate?: boolean;

  /** Customer billing details (= shipping details for us). */
  billing: {
    customerName: string;
    lastName?: string;
    address: string;
    address2?: string;
    city: string;
    state: string;
    country?: string;
    pincode: string;
    email: string;
    phone: string;
  };

  /** Shipping is the same as billing for our flow. */
  shippingIsBilling?: boolean;

  /** Order items. */
  orderItems: Array<{
    name: string;
    sku: string;
    units: number;
    sellingPrice: number;
    discount?: number;
    tax?: number;
    hsn?: number;
  }>;

  /** Order totals (Shiprocket needs the post-discount sub_total only). */
  subTotal: number;

  /** Shipment dimensions. */
  weightKg: number;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
}

export interface CreateOrderResult {
  shiprocketOrderId: string;
  shipmentId: string;
  status: string;
  awbCode: string | null;
  raw?: unknown;
}

export async function createShiprocketOrder(
  p: CreateOrderParams,
): Promise<CreateOrderResult> {
  const body = {
    order_id: p.orderId,
    order_date: p.orderDate,
    pickup_location: p.pickupLocation,
    payment_method: p.paymentMethod,
    sub_total: Number(p.subTotal.toFixed(2)),

    billing_customer_name: p.billing.customerName,
    billing_last_name: p.billing.lastName ?? "",
    billing_address: p.billing.address,
    billing_address_2: p.billing.address2 ?? "",
    billing_city: p.billing.city,
    billing_pincode: p.billing.pincode,
    billing_state: p.billing.state,
    billing_country: p.billing.country ?? "India",
    billing_email: p.billing.email,
    billing_phone: p.billing.phone,
    shipping_is_billing: p.shippingIsBilling ?? true,

    order_items: p.orderItems.map((it) => ({
      name: it.name.slice(0, 100),
      sku: it.sku.slice(0, 60),
      units: it.units,
      selling_price: Number(it.sellingPrice.toFixed(2)),
      discount: it.discount ? Number(it.discount.toFixed(2)) : "",
      tax: it.tax ? Number(it.tax.toFixed(2)) : "",
      hsn: it.hsn ?? "",
    })),

    weight: Number(p.weightKg.toFixed(3)),
    length: p.lengthCm,
    breadth: p.breadthCm,
    height: p.heightCm,
  };

  const res = await srFetch<{
    order_id?: number | string;
    shipment_id?: number | string;
    status?: string;
    awb_code?: string;
  }>("/orders/create/adhoc", { method: "POST", body });

  return {
    shiprocketOrderId: String(res.order_id ?? ""),
    shipmentId: String(res.shipment_id ?? ""),
    status: res.status ?? "NEW",
    awbCode: res.awb_code ? String(res.awb_code) : null,
    raw: process.env.NODE_ENV === "development" ? res : undefined,
  };
}

/* ============================================================
   3) ASSIGN AWB  —  pick a courier + AWB for an existing shipment
   ============================================================ */

export interface AssignAwbResult {
  awbCode: string;
  courierCompanyId: string;
  courierName: string | null;
  raw?: unknown;
}

export async function assignAwb(
  shipmentId: string,
  courierCompanyId?: number,
): Promise<AssignAwbResult> {
  const body: Record<string, unknown> = {
    shipment_id: Number(shipmentId),
  };
  if (courierCompanyId) body.courier_id = courierCompanyId;

  const res = await srFetch<{
    awb_assign_status?: number;
    response?: {
      data?: {
        awb_code?: string;
        courier_company_id?: number | string;
        courier_name?: string;
      };
    };
    message?: string;
  }>("/courier/assign/awb", { method: "POST", body });

  const awb = res.response?.data?.awb_code;
  if (!awb) {
    throw new ShiprocketError(
      res.message || "Shiprocket AWB assignment did not return an AWB code",
      502,
      res,
    );
  }
  return {
    awbCode: String(awb),
    courierCompanyId: String(res.response?.data?.courier_company_id ?? ""),
    courierName: res.response?.data?.courier_name ?? null,
    raw: process.env.NODE_ENV === "development" ? res : undefined,
  };
}

/* ============================================================
   4) CANCEL ORDER
   ============================================================ */

export async function cancelShiprocketOrder(
  shiprocketOrderId: string,
): Promise<{ status: string }> {
  const res = await srFetch<{ status_code?: number; message?: string }>(
    "/orders/cancel",
    {
      method: "POST",
      body: { ids: [Number(shiprocketOrderId)] },
    },
  );
  return { status: res.message ?? "cancelled" };
}

/* ============================================================
   5) TRACK (by AWB code)
   ============================================================ */

export interface TrackingResult {
  awbCode: string;
  currentStatus: string | null;
  shipmentTrack:
    | Array<{
        date: string;
        status: string;
        activity: string;
        location: string;
      }>
    | null;
  raw?: unknown;
}

interface TrackingByAwbResponse {
  tracking_data?: {
    track_status?: number;
    shipment_status?: number;
    shipment_track?: Array<{
      current_status?: string;
    }>;
    shipment_track_activities?: Array<{
      date?: string;
      status?: string;
      activity?: string;
      location?: string;
    }>;
    error?: string;
  };
}

export async function trackByAwb(awbCode: string): Promise<TrackingResult> {
  const res = await srFetch<TrackingByAwbResponse>(
    `/courier/track/awb/${encodeURIComponent(awbCode)}`,
    { method: "GET" },
  );
  const td = res.tracking_data;
  return {
    awbCode,
    currentStatus: td?.shipment_track?.[0]?.current_status ?? null,
    shipmentTrack:
      td?.shipment_track_activities?.map((a) => ({
        date: String(a.date ?? ""),
        status: String(a.status ?? ""),
        activity: String(a.activity ?? ""),
        location: String(a.location ?? ""),
      })) ?? null,
    raw: process.env.NODE_ENV === "development" ? res : undefined,
  };
}

/* ============================================================
   6) WEBHOOK TOKEN VERIFY
   ============================================================ */

/**
 * Shiprocket sends a static `X-Api-Key` header with the value you
 * configure in their dashboard. We validate it against the
 * SHIPROCKET_WEBHOOK_TOKEN env var. Returns true if valid.
 */
export function verifyShiprocketWebhookToken(headerValue: string | null): boolean {
  const expected = process.env.SHIPROCKET_WEBHOOK_TOKEN;
  if (!expected) return false;
  if (!headerValue) return false;
  // Constant-time-ish comparison
  if (headerValue.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < headerValue.length; i++) {
    diff |= headerValue.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
