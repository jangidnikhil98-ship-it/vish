import "server-only";

import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { coupons, couponRedemptions } from "@/lib/db/schema";
import { buildListResult, type ListResult } from "@/lib/admin-pagination";

/* ============================================================
   TYPES
   ============================================================ */

export interface AdminCouponRow {
  id: number;
  code: string;
  type: "percent" | "free_shipping";
  value: string;
  min_order_amount: string;
  max_discount_amount: string | null;
  usage_limit: number | null;
  used_count: number;
  description: string | null;
  valid_from: Date | null;
  valid_until: Date | null;
  is_active: number;
  created_at: Date | null;
}

/** Inputs accepted by createAdminCoupon / updateAdminCoupon. The schema in
 *  `lib/validators/admin.ts` produces this shape (after string coercion). */
export interface AdminCouponWriteInput {
  code: string;
  type: "percent" | "free_shipping";
  value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  description: string;
  valid_from: string | null;
  valid_until: string | null;
  is_active: number;
}

/* ============================================================
   READS
   ============================================================ */

export async function listAdminCoupons(params: {
  page: number;
  perPage: number;
  keyword: string;
}): Promise<ListResult<AdminCouponRow>> {
  const { page, perPage, keyword } = params;
  const offset = (page - 1) * perPage;

  const whereParts = [];
  if (keyword) {
    const term = `%${keyword}%`;
    whereParts.push(or(like(coupons.code, term), like(coupons.description, term))!);
  }
  const whereExpr = whereParts.length ? and(...whereParts) : undefined;

  const rows = await db
    .select({
      id: coupons.id,
      code: coupons.code,
      type: coupons.type,
      value: coupons.value,
      min_order_amount: coupons.min_order_amount,
      max_discount_amount: coupons.max_discount_amount,
      usage_limit: coupons.usage_limit,
      used_count: coupons.used_count,
      description: coupons.description,
      valid_from: coupons.valid_from,
      valid_until: coupons.valid_until,
      is_active: coupons.is_active,
      created_at: coupons.created_at,
    })
    .from(coupons)
    .where(whereExpr)
    .orderBy(desc(coupons.id))
    .limit(perPage)
    .offset(offset);

  const [{ count } = { count: 0 }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(coupons)
    .where(whereExpr);

  return buildListResult(rows, Number(count), page, perPage);
}

export async function getAdminCouponById(
  id: number,
): Promise<AdminCouponRow | null> {
  const rows = await db
    .select({
      id: coupons.id,
      code: coupons.code,
      type: coupons.type,
      value: coupons.value,
      min_order_amount: coupons.min_order_amount,
      max_discount_amount: coupons.max_discount_amount,
      usage_limit: coupons.usage_limit,
      used_count: coupons.used_count,
      description: coupons.description,
      valid_from: coupons.valid_from,
      valid_until: coupons.valid_until,
      is_active: coupons.is_active,
      created_at: coupons.created_at,
    })
    .from(coupons)
    .where(eq(coupons.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/** Existence check for the create-form unique-code validation. */
export async function couponCodeExists(
  code: string,
  excludeId?: number,
): Promise<boolean> {
  const upper = code.trim().toUpperCase();
  const rows = await db
    .select({ id: coupons.id })
    .from(coupons)
    .where(eq(coupons.code, upper))
    .limit(1);
  if (rows.length === 0) return false;
  if (excludeId && rows[0].id === excludeId) return false;
  return true;
}

/* ============================================================
   WRITES
   ============================================================ */

function toMysqlDateTime(input: string | null): Date | null {
  if (!input) return null;
  const d = new Date(input.length === 10 ? `${input}T00:00:00` : input);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export async function createAdminCoupon(
  input: AdminCouponWriteInput,
): Promise<number> {
  const result = await db.insert(coupons).values({
    code: input.code.trim().toUpperCase(),
    type: input.type,
    value: input.value.toFixed(2),
    min_order_amount: input.min_order_amount.toFixed(2),
    max_discount_amount:
      input.max_discount_amount === null
        ? null
        : input.max_discount_amount.toFixed(2),
    usage_limit: input.usage_limit ?? null,
    description: input.description?.trim() || null,
    valid_from: toMysqlDateTime(input.valid_from),
    valid_until: toMysqlDateTime(input.valid_until),
    is_active: input.is_active,
    created_at: sql`CURRENT_TIMESTAMP`,
    updated_at: sql`CURRENT_TIMESTAMP`,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const insertId = (result as any)[0]?.insertId ?? (result as any).insertId;
  return Number(insertId);
}

export async function updateAdminCoupon(
  id: number,
  input: AdminCouponWriteInput,
): Promise<void> {
  await db
    .update(coupons)
    .set({
      code: input.code.trim().toUpperCase(),
      type: input.type,
      value: input.value.toFixed(2),
      min_order_amount: input.min_order_amount.toFixed(2),
      max_discount_amount:
        input.max_discount_amount === null
          ? null
          : input.max_discount_amount.toFixed(2),
      usage_limit: input.usage_limit ?? null,
      description: input.description?.trim() || null,
      valid_from: toMysqlDateTime(input.valid_from),
      valid_until: toMysqlDateTime(input.valid_until),
      is_active: input.is_active,
      updated_at: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(coupons.id, id));
}

export async function setAdminCouponActive(
  id: number,
  active: boolean,
): Promise<void> {
  await db
    .update(coupons)
    .set({ is_active: active ? 1 : 0, updated_at: sql`CURRENT_TIMESTAMP` })
    .where(eq(coupons.id, id));
}

export async function deleteAdminCoupon(id: number): Promise<void> {
  await db.delete(coupons).where(eq(coupons.id, id));
  // We deliberately keep coupon_redemptions rows so order history stays
  // intact; their coupon_id will dangle, but UI shows order.coupon_code.
}

/* ============================================================
   STOREFRONT — coupon application (server-side, tamper-resistant)
   ============================================================ */

export type CouponApplyResult =
  | {
      ok: true;
      coupon: {
        id: number;
        code: string;
        type: "percent" | "free_shipping";
      };
      /** Discount applied to subtotal (rupees, 2 dp). */
      discountAmount: number;
      /** "free_shipping" coupons set this to true so the caller waives
       *  the shipping fee. */
      freeShipping: boolean;
      /** Human-readable message for the UI ("10% off applied"). */
      message: string;
    }
  | {
      ok: false;
      /** Why the coupon was rejected (shown to the user). */
      message: string;
    };

/**
 * Resolve a coupon code against the cart subtotal and current time.
 *
 * `paymentMethod` matters because we may add COD-restricted coupons later
 * (right now the rule is informational; both methods accept all coupons).
 *
 * Always returns a friendly user-facing `message` — never leaks DB errors.
 */
export async function resolveCoupon(params: {
  code: string;
  subtotal: number;
  paymentMethod: "razorpay" | "cod";
}): Promise<CouponApplyResult> {
  const code = params.code.trim().toUpperCase();
  if (!code) return { ok: false, message: "Please enter a coupon code." };

  const [row] = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, code))
    .limit(1);

  if (!row) return { ok: false, message: "Invalid coupon code." };
  if (row.is_active !== 1) {
    return { ok: false, message: "This coupon is no longer active." };
  }

  const now = new Date();
  if (row.valid_from && now < row.valid_from) {
    return { ok: false, message: "This coupon isn't active yet." };
  }
  if (row.valid_until && now > row.valid_until) {
    return { ok: false, message: "This coupon has expired." };
  }
  if (
    row.usage_limit !== null &&
    row.used_count >= row.usage_limit
  ) {
    return {
      ok: false,
      message: "This coupon has reached its usage limit.",
    };
  }

  const minOrder = Number(row.min_order_amount ?? 0);
  if (params.subtotal < minOrder) {
    return {
      ok: false,
      message: `Add ₹${(minOrder - params.subtotal).toFixed(0)} more to use this coupon.`,
    };
  }

  if (row.type === "free_shipping") {
    return {
      ok: true,
      coupon: { id: row.id, code: row.code, type: "free_shipping" },
      discountAmount: 0,
      freeShipping: true,
      message: "Free shipping applied.",
    };
  }

  // Percent coupon
  const pct = Number(row.value ?? 0);
  let discount = (params.subtotal * pct) / 100;
  if (row.max_discount_amount !== null) {
    const cap = Number(row.max_discount_amount);
    if (discount > cap) discount = cap;
  }
  // Round to nearest paisa (2 dp)
  discount = Math.round(discount * 100) / 100;
  if (discount <= 0) {
    return { ok: false, message: "This coupon doesn't apply to your cart." };
  }

  return {
    ok: true,
    coupon: { id: row.id, code: row.code, type: "percent" },
    discountAmount: discount,
    freeShipping: false,
    message: `${pct.toFixed(0)}% off applied (₹${discount.toFixed(2)}).`,
  };
}

/**
 * Atomically:
 *   1) Increment `coupons.used_count`
 *   2) Insert a `coupon_redemptions` row pointing at the new order
 *
 * Called from `createOrderWithItems` AFTER the order row is created.
 * If the coupon's `usage_limit` was already hit between the apply-coupon
 * call and now (race condition), we throw so the order is rolled back.
 */
export async function recordCouponRedemption(params: {
  couponId: number;
  orderId: number;
  userId: number | null;
  guestId: string | null;
  discountAmount: number;
}): Promise<void> {
  await db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        id: coupons.id,
        usage_limit: coupons.usage_limit,
        used_count: coupons.used_count,
      })
      .from(coupons)
      .where(eq(coupons.id, params.couponId))
      .for("update");

    if (!row) {
      throw new Error("Coupon disappeared between apply and checkout.");
    }
    if (row.usage_limit !== null && row.used_count >= row.usage_limit) {
      throw new Error("Coupon usage limit was reached just now.");
    }

    await tx
      .update(coupons)
      .set({
        used_count: sql`${coupons.used_count} + 1`,
        updated_at: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(coupons.id, params.couponId));

    await tx.insert(couponRedemptions).values({
      coupon_id: params.couponId,
      order_id: params.orderId,
      user_id: params.userId ?? null,
      guest_id: params.guestId ?? null,
      discount_amount: params.discountAmount.toFixed(2),
      created_at: sql`CURRENT_TIMESTAMP`,
    });
  });
}
