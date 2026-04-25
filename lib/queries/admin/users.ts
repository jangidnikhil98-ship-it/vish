import "server-only";

import { and, desc, eq, isNull, like, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { buildListResult, type ListResult } from "@/lib/admin-pagination";

/* ============================================================
   ADMIN USER LIST
   Mirrors UserRepository@getActivePaginated:
     - filters out soft-deleted rows
     - keyword searches first/last name + email + phone
     - newest first
   ============================================================ */
export interface AdminUserRow {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  is_active: number;
  is_email_verify: number;
  role: string;
  city: string | null;
  country_code: string | null;
  company_name: string | null;
  last_login_at: Date | null;
}

export async function listAdminUsers(params: {
  page: number;
  perPage: number;
  keyword: string;
}): Promise<ListResult<AdminUserRow>> {
  const { page, perPage, keyword } = params;
  const offset = (page - 1) * perPage;

  const whereParts = [isNull(users.deleted_at)];
  // Original Laravel admin tab is supposed to list customers, but never
  // explicitly excluded admins — keep the same behaviour.
  if (keyword) {
    const term = `%${keyword}%`;
    whereParts.push(
      or(
        like(users.first_name, term),
        like(users.last_name, term),
        like(users.email, term),
        like(users.phone, term),
        like(users.company_name, term),
      )!,
    );
  }
  const whereExpr = and(...whereParts);

  const rows = await db
    .select({
      id: users.id,
      first_name: users.first_name,
      last_name: users.last_name,
      email: users.email,
      phone: users.phone,
      is_active: users.is_active,
      is_email_verify: users.is_email_verify,
      role: users.role,
      city: users.city,
      country_code: users.country_code,
      company_name: users.company_name,
      last_login_at: users.last_login_at,
    })
    .from(users)
    .where(whereExpr)
    .orderBy(desc(users.id))
    .limit(perPage)
    .offset(offset);

  const [{ count } = { count: 0 }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .where(whereExpr);

  return buildListResult(rows, Number(count), page, perPage);
}

export async function getAdminUserById(
  id: number,
): Promise<AdminUserRow | null> {
  const rows = await db
    .select({
      id: users.id,
      first_name: users.first_name,
      last_name: users.last_name,
      email: users.email,
      phone: users.phone,
      is_active: users.is_active,
      is_email_verify: users.is_email_verify,
      role: users.role,
      city: users.city,
      country_code: users.country_code,
      company_name: users.company_name,
      last_login_at: users.last_login_at,
    })
    .from(users)
    .where(and(eq(users.id, id), isNull(users.deleted_at)))
    .limit(1);
  return rows[0] ?? null;
}

/* ============================================================
   ADMIN USER WRITES
   ============================================================ */
export async function updateAdminUserDetails(
  id: number,
  data: {
    first_name: string;
    last_name: string;
    phone: string | null;
    city: string | null;
    country_code: string | null;
  },
): Promise<void> {
  await db
    .update(users)
    .set({ ...data, updated_at: sql`CURRENT_TIMESTAMP` })
    .where(eq(users.id, id));
}

export async function setAdminUserActive(
  id: number,
  active: boolean,
): Promise<void> {
  await db
    .update(users)
    .set({ is_active: active ? 1 : 0, updated_at: sql`CURRENT_TIMESTAMP` })
    .where(eq(users.id, id));
}

/**
 * Soft-delete (matches Laravel's `SoftDeletes` trait — sets `deleted_at`
 * but keeps the row).
 */
export async function softDeleteAdminUser(id: number): Promise<void> {
  await db
    .update(users)
    .set({ deleted_at: sql`CURRENT_TIMESTAMP` })
    .where(eq(users.id, id));
}

/* ============================================================
   ADMIN SETTINGS WRITES (own profile)
   ============================================================ */
export async function updateOwnProfile(
  id: number,
  data: { first_name: string; last_name: string; company_name: string | null },
): Promise<void> {
  await db
    .update(users)
    .set({ ...data, updated_at: sql`CURRENT_TIMESTAMP` })
    .where(eq(users.id, id));
}

export interface AdminOwnSettings {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  company_name: string | null;
}

export async function getAdminOwnSettings(
  id: number,
): Promise<AdminOwnSettings | null> {
  const rows = await db
    .select({
      id: users.id,
      first_name: users.first_name,
      last_name: users.last_name,
      email: users.email,
      company_name: users.company_name,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return rows[0] ?? null;
}
