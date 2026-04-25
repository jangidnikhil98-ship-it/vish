import "server-only";

import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { enquiries } from "@/lib/db/schema";
import { buildListResult, type ListResult } from "@/lib/admin-pagination";

export interface AdminEnquiryRow {
  id: number;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  created_at: Date | null;
}

export async function listAdminEnquiries(params: {
  page: number;
  perPage: number;
  keyword: string;
}): Promise<ListResult<AdminEnquiryRow>> {
  const { page, perPage, keyword } = params;
  const offset = (page - 1) * perPage;

  const whereParts = [];
  if (keyword) {
    const term = `%${keyword}%`;
    whereParts.push(
      or(
        like(enquiries.full_name, term),
        like(enquiries.email, term),
        like(enquiries.phone, term),
        like(enquiries.message, term),
      )!,
    );
  }
  const whereExpr = whereParts.length ? and(...whereParts) : undefined;

  const rows = await db
    .select({
      id: enquiries.id,
      full_name: enquiries.full_name,
      email: enquiries.email,
      phone: enquiries.phone,
      message: enquiries.message,
      created_at: enquiries.created_at,
    })
    .from(enquiries)
    .where(whereExpr)
    .orderBy(desc(enquiries.id))
    .limit(perPage)
    .offset(offset);

  const [{ count } = { count: 0 }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(enquiries)
    .where(whereExpr);

  return buildListResult(rows, Number(count), page, perPage);
}

export async function deleteAdminEnquiry(id: number): Promise<void> {
  await db.delete(enquiries).where(eq(enquiries.id, id));
}
