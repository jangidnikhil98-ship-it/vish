import "server-only";

import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  orderItems,
  orders,
  paymentDetails,
  shippingDetails,
  users,
} from "@/lib/db/schema";
import { buildListResult, type ListResult } from "@/lib/admin-pagination";

/* ============================================================
   ADMIN ORDER LIST
   ============================================================ */
export interface AdminOrderRow {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  grand_total: string | null;
  buyer_name: string | null;
  created_at: Date | null;
}

export async function listAdminOrders(params: {
  page: number;
  perPage: number;
  keyword: string;
}): Promise<ListResult<AdminOrderRow>> {
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
        like(users.email, term),
      )!,
    );
  }
  const whereExpr = whereParts.length ? and(...whereParts) : undefined;

  const rows = await db
    .select({
      id: orders.id,
      order_number: orders.order_number,
      status: orders.status,
      payment_status: orders.payment_status,
      grand_total: orders.grand_total,
      first_name: users.first_name,
      last_name: users.last_name,
      created_at: orders.created_at,
    })
    .from(orders)
    .leftJoin(users, eq(users.id, orders.user_id))
    .where(whereExpr)
    .orderBy(desc(orders.id))
    .limit(perPage)
    .offset(offset);

  const [{ count } = { count: 0 }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(orders)
    .leftJoin(users, eq(users.id, orders.user_id))
    .where(whereExpr);

  const data: AdminOrderRow[] = rows.map((r) => ({
    id: r.id,
    order_number: r.order_number,
    status: r.status,
    payment_status: r.payment_status,
    grand_total: r.grand_total,
    buyer_name:
      r.first_name || r.last_name
        ? `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim()
        : null,
    created_at: r.created_at,
  }));

  return buildListResult(data, Number(count), page, perPage);
}

/* ============================================================
   ADMIN ORDER DETAIL
   ============================================================ */
export interface AdminOrderItem {
  id: number;
  product_id: number | null;
  product_name: string | null;
  price: string | null;
  quantity: number | null;
  product_size: string | null;
  variation_option: string | null;
  front_image: string | null;
  back_image: string | null;
  front_text: string | null;
  back_text: string | null;
}

export interface AdminOrderDetail {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  grand_total: string | null;
  quantity: number | null;
  created_at: Date | null;
  buyer:
    | {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
        phone: string | null;
      }
    | null;
  shipping: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    apartment: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
  } | null;
  payment: {
    method: string | null;
    razorpay_order_id: string | null;
    razorpay_payment_id: string | null;
    status: string | null;
    amount: string | null;
  } | null;
  items: AdminOrderItem[];
}

export async function getAdminOrderById(
  id: number,
): Promise<AdminOrderDetail | null> {
  const [order] = await db
    .select({
      id: orders.id,
      order_number: orders.order_number,
      status: orders.status,
      payment_status: orders.payment_status,
      grand_total: orders.grand_total,
      quantity: orders.quantity,
      created_at: orders.created_at,
      user_id: orders.user_id,
    })
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  if (!order) return null;

  const [buyer, shipping, payment, items] = await Promise.all([
    order.user_id
      ? db
          .select({
            id: users.id,
            first_name: users.first_name,
            last_name: users.last_name,
            email: users.email,
            phone: users.phone,
          })
          .from(users)
          .where(eq(users.id, order.user_id))
          .limit(1)
          .then((rs) => rs[0] ?? null)
      : Promise.resolve(null),
    db
      .select({
        first_name: shippingDetails.first_name,
        last_name: shippingDetails.last_name,
        email: shippingDetails.email,
        phone: shippingDetails.phone,
        address: shippingDetails.address,
        apartment: shippingDetails.apartment,
        city: shippingDetails.city,
        state: shippingDetails.state,
        pincode: shippingDetails.pincode,
      })
      .from(shippingDetails)
      .where(eq(shippingDetails.order_id, id))
      .orderBy(desc(shippingDetails.id))
      .limit(1)
      .then((rs) => rs[0] ?? null),
    db
      .select({
        method: paymentDetails.payment_method,
        razorpay_order_id: paymentDetails.razorpay_order_id,
        razorpay_payment_id: paymentDetails.razorpay_payment_id,
        status: paymentDetails.status,
        amount: paymentDetails.amount,
      })
      .from(paymentDetails)
      .where(eq(paymentDetails.order_id, id))
      .orderBy(desc(paymentDetails.id))
      .limit(1)
      .then((rs) => rs[0] ?? null),
    db
      .select({
        id: orderItems.id,
        product_id: orderItems.product_id,
        product_name: orderItems.product_name,
        price: orderItems.price,
        quantity: orderItems.quantity,
        product_size: orderItems.product_size,
        variation_option: orderItems.variation_option,
        front_image: orderItems.front_image,
        back_image: orderItems.back_image,
        front_text: orderItems.front_text,
        back_text: orderItems.back_text,
      })
      .from(orderItems)
      .where(eq(orderItems.order_id, id))
      .orderBy(orderItems.id),
  ]);

  return {
    id: order.id,
    order_number: order.order_number,
    status: order.status,
    payment_status: order.payment_status,
    grand_total: order.grand_total,
    quantity: order.quantity,
    created_at: order.created_at,
    buyer,
    shipping,
    payment,
    items,
  };
}

/* ============================================================
   ADMIN ORDER WRITES
   ============================================================ */
export async function setAdminOrderStatus(
  id: number,
  status: "pending" | "processing" | "completed" | "cancelled",
): Promise<void> {
  await db
    .update(orders)
    .set({ status, updated_at: sql`CURRENT_TIMESTAMP` })
    .where(eq(orders.id, id));
}

export async function deleteAdminOrder(id: number): Promise<void> {
  // The orders table doesn't use soft-deletes; removing it cascades nothing
  // automatically (no FK in the migrations) so we have to clean up children.
  await db.delete(orderItems).where(eq(orderItems.order_id, id));
  await db.delete(shippingDetails).where(eq(shippingDetails.order_id, id));
  await db.delete(paymentDetails).where(eq(paymentDetails.order_id, id));
  await db.delete(orders).where(eq(orders.id, id));
}
