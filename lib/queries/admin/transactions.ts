import "server-only";

import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, transactionHistories, users } from "@/lib/db/schema";
import { buildListResult, type ListResult } from "@/lib/admin-pagination";

export interface AdminTransactionRow {
  id: number;
  order_id: number;
  order_number: string | null;
  buyer_name: string | null;
  amount: string;
  payment_method: string;
  status: string;
  created_at: Date | null;
}

export async function listAdminTransactions(params: {
  page: number;
  perPage: number;
  keyword: string;
}): Promise<ListResult<AdminTransactionRow>> {
  const { page, perPage, keyword } = params;
  const offset = (page - 1) * perPage;

  const whereParts = [];
  if (keyword) {
    const term = `%${keyword}%`;
    whereParts.push(
      or(
        like(orders.order_number, term),
        like(users.first_name, term),
        like(users.last_name, term),
      )!,
    );
  }
  const whereExpr = whereParts.length ? and(...whereParts) : undefined;

  const rows = await db
    .select({
      id: transactionHistories.id,
      order_id: transactionHistories.order_id,
      order_number: orders.order_number,
      first_name: users.first_name,
      last_name: users.last_name,
      amount: transactionHistories.amount,
      payment_method: transactionHistories.payment_method,
      status: transactionHistories.status,
      created_at: transactionHistories.created_at,
    })
    .from(transactionHistories)
    .leftJoin(orders, eq(orders.id, transactionHistories.order_id))
    .leftJoin(users, eq(users.id, orders.user_id))
    .where(whereExpr)
    .orderBy(desc(transactionHistories.id))
    .limit(perPage)
    .offset(offset);

  const [{ count } = { count: 0 }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(transactionHistories)
    .leftJoin(orders, eq(orders.id, transactionHistories.order_id))
    .leftJoin(users, eq(users.id, orders.user_id))
    .where(whereExpr);

  const data: AdminTransactionRow[] = rows.map((r) => ({
    id: r.id,
    order_id: r.order_id,
    order_number: r.order_number,
    buyer_name:
      r.first_name || r.last_name
        ? `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim()
        : null,
    amount: r.amount,
    payment_method: r.payment_method,
    status: r.status,
    created_at: r.created_at,
  }));

  return buildListResult(data, Number(count), page, perPage);
}

export interface AdminTransactionDetail {
  id: number;
  order_id: number;
  order_number: string | null;
  buyer_name: string | null;
  amount: string;
  payment_method: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  status: string;
  payment_details: string | null;
  created_at: Date | null;
}

export async function getAdminTransactionById(
  id: number,
): Promise<AdminTransactionDetail | null> {
  const [r] = await db
    .select({
      id: transactionHistories.id,
      order_id: transactionHistories.order_id,
      order_number: orders.order_number,
      first_name: users.first_name,
      last_name: users.last_name,
      amount: transactionHistories.amount,
      payment_method: transactionHistories.payment_method,
      razorpay_order_id: transactionHistories.razorpay_order_id,
      razorpay_payment_id: transactionHistories.razorpay_payment_id,
      status: transactionHistories.status,
      payment_details: transactionHistories.payment_details,
      created_at: transactionHistories.created_at,
    })
    .from(transactionHistories)
    .leftJoin(orders, eq(orders.id, transactionHistories.order_id))
    .leftJoin(users, eq(users.id, orders.user_id))
    .where(eq(transactionHistories.id, id))
    .limit(1);

  if (!r) return null;
  return {
    id: r.id,
    order_id: r.order_id,
    order_number: r.order_number,
    buyer_name:
      r.first_name || r.last_name
        ? `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim()
        : null,
    amount: r.amount,
    payment_method: r.payment_method,
    razorpay_order_id: r.razorpay_order_id,
    razorpay_payment_id: r.razorpay_payment_id,
    status: r.status,
    payment_details: r.payment_details,
    created_at: r.created_at,
  };
}
