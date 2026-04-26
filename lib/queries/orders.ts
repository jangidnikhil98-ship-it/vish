import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  orderItems,
  orders,
  paymentDetails,
  productSizes,
  products,
  shippingDetails,
} from "@/lib/db/schema";
import type { CartItemInput, ShippingInput } from "@/lib/validators/checkout";

/* ============================================================
   TYPES
   ============================================================ */
export type PricedLineItem = CartItemInput & {
  unitPrice: number; // INR (rupees, 2 decimals)
  productName: string | null;
  productSizeLabel: string | null;
};

export type PricedCart = {
  items: PricedLineItem[];
  subtotal: number; // INR rupees
  totalQuantity: number;
};

/* ============================================================
   HELPERS
   ============================================================ */

const toNum = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Price-stamp a cart server-side.
 *
 * For every line we look up `products.product_name` and the size's
 * `final_price` (the discount-applied price) directly from the database.
 * The client's posted `unitPrice` is **deliberately ignored** so a
 * tampered client cannot pay less than the listed price.
 *
 * Behaviour (mirrors PaymentController::create):
 *   - subtotal = sum( finalPrice * quantity )
 *   - if a sizeId is given but no longer exists for the product, the line
 *     is rejected (returns null).
 *   - if no sizeId is given we fall back to the default size, then to any
 *     size, then to `products.price` as a last resort.
 */
export async function priceCart(
  items: CartItemInput[],
): Promise<PricedCart | null> {
  if (items.length === 0) return null;

  const productIds = Array.from(new Set(items.map((i) => i.productId)));
  const sizeIds = Array.from(
    new Set(items.map((i) => i.sizeId).filter((x): x is number => !!x)),
  );

  const [productRows, sizeRows, allSizes] = await Promise.all([
    db
      .select({
        id: products.id,
        name: products.product_name,
        basePrice: products.price,
      })
      .from(products)
      .where(inArray(products.id, productIds)),

    sizeIds.length > 0
      ? db
          .select({
            id: productSizes.id,
            productId: productSizes.product_id,
            label: productSizes.label,
            price: productSizes.price,
            finalPrice: productSizes.final_price,
            isDefault: productSizes.is_default,
          })
          .from(productSizes)
          .where(inArray(productSizes.id, sizeIds))
      : Promise.resolve([] as Array<{
          id: number;
          productId: number;
          label: string | null;
          price: string;
          finalPrice: string;
          isDefault: number;
        }>),

    db
      .select({
        id: productSizes.id,
        productId: productSizes.product_id,
        label: productSizes.label,
        price: productSizes.price,
        finalPrice: productSizes.final_price,
        isDefault: productSizes.is_default,
      })
      .from(productSizes)
      .where(inArray(productSizes.product_id, productIds)),
  ]);

  const productById = new Map(productRows.map((p) => [p.id, p]));
  const sizeById = new Map(sizeRows.map((s) => [s.id, s]));
  const sizesByProduct = new Map<number, typeof allSizes>();
  for (const s of allSizes) {
    const arr = sizesByProduct.get(s.productId) ?? [];
    arr.push(s);
    sizesByProduct.set(s.productId, arr);
  }

  const priced: PricedLineItem[] = [];
  let subtotal = 0;
  let totalQuantity = 0;

  for (const item of items) {
    const product = productById.get(item.productId);
    if (!product) return null;

    let unitPrice = 0;
    let sizeLabel: string | null = null;

    if (item.sizeId) {
      const size = sizeById.get(item.sizeId);
      if (!size || size.productId !== item.productId) return null;
      unitPrice = toNum(size.finalPrice);
      sizeLabel = size.label;
    } else {
      const productSizesForProduct = sizesByProduct.get(item.productId) ?? [];
      const fallback =
        productSizesForProduct.find((s) => Number(s.isDefault) === 1) ??
        productSizesForProduct[0];
      if (fallback) {
        unitPrice = toNum(fallback.finalPrice);
        sizeLabel = fallback.label;
      } else {
        unitPrice = toNum(product.basePrice);
      }
    }

    if (unitPrice <= 0) return null;

    subtotal += unitPrice * item.quantity;
    totalQuantity += item.quantity;

    priced.push({
      ...item,
      unitPrice: Math.round(unitPrice * 100) / 100,
      productName: product.name,
      productSizeLabel: item.productSize ?? sizeLabel,
    });
  }

  return {
    items: priced,
    subtotal: Math.round(subtotal * 100) / 100,
    totalQuantity,
  };
}

/* ============================================================
   MUTATIONS
   ============================================================ */

export type OrderRow = typeof orders.$inferSelect;

/**
 * Create order + order_items + shipping_details + payment_details (initial).
 *
 * Bug fixes vs the original Laravel `PaymentController@create`:
 *   - `grand_total` is stored in INR (rupees, decimal 10,2), NOT paise.
 *     The original stored the paise amount which inflates the saved value
 *     by 100x given `decimal(10,2)`.
 *   - `quantity` on the orders row is now populated.
 *   - All cart lines are persisted to `order_items` (was missing entirely).
 *   - The initial `payment_details.status` is `'created'` (was incorrectly
 *     set to `'completed'` before any payment had occurred).
 *   - `payment_details.amount` is stored.
 *
 * Runs inside a single MySQL transaction.
 */
export async function createOrderWithItems(params: {
  userId: number | null;
  guestId: string | null;
  shipping: ShippingInput;
  pricedCart: PricedCart;
  razorpayOrderId: string | null;
  paymentMethod?: string | null;
}): Promise<OrderRow> {
  return db.transaction(async (tx) => {
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()}`;

    const [orderInsert] = await tx.insert(orders).values({
      user_id: params.userId,
      guest_id: params.guestId,
      order_number: orderNumber,
      status: "pending",
      grand_total: params.pricedCart.subtotal.toFixed(2),
      quantity: params.pricedCart.totalQuantity,
      payment_status: "pending",
    });

    const orderId = Number(orderInsert.insertId);

    await tx.insert(orderItems).values(
      params.pricedCart.items.map((it) => ({
        order_id: orderId,
        product_id: it.productId,
        product_name: it.productName,
        price: it.unitPrice.toFixed(2),
        quantity: it.quantity,
        variation_option: it.variation ?? null,
        product_size: it.productSizeLabel ?? null,
        gift_wrap: it.giftWrapping,
        front_image: it.frontImageUrl ?? null,
        front_text: it.frontMessage ?? null,
        back_image: it.backImageUrl ?? null,
        back_text: it.backMessage ?? null,
      })),
    );

    await tx.insert(shippingDetails).values({
      order_id: orderId,
      user_id: params.userId ?? 0,
      guest_id: params.guestId,
      first_name: params.shipping.first_name,
      last_name: params.shipping.last_name ?? "",
      email: params.shipping.email,
      phone: params.shipping.phone,
      address: params.shipping.address ?? "",
      apartment: params.shipping.apartment ?? "",
      city: params.shipping.city ?? "",
      state: params.shipping.state,
      pincode: params.shipping.pincode,
      is_save: params.shipping.is_save ? 1 : 0,
    });

    await tx.insert(paymentDetails).values({
      order_id: orderId,
      payment_method: params.paymentMethod ?? "razorpay",
      amount: params.pricedCart.subtotal.toFixed(2),
      razorpay_order_id: params.razorpayOrderId,
      razorpay_payment_id: null,
      status: "created",
      payment_details: null,
    });

    const [created] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    if (!created) throw new Error("Failed to read back created order");
    return created;
  });
}

/**
 * Mark an order paid + update payment row. Looks up by razorpay_order_id
 * (matches the lookup in PaymentController::success).
 *
 * Returns `wasAlreadyPaid: true` when the payment row was already
 * `completed` before this call — callers use that to avoid sending the
 * order-confirmation email twice (once from verify-payment, once from the
 * webhook).
 */
export async function markOrderPaid(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  rawPaymentJson: string | null;
}): Promise<{
  orderId: number;
  email: string | null;
  wasAlreadyPaid: boolean;
} | null> {
  return db.transaction(async (tx) => {
    const [payment] = await tx
      .select()
      .from(paymentDetails)
      .where(eq(paymentDetails.razorpay_order_id, params.razorpayOrderId))
      .orderBy(sql`${paymentDetails.id} DESC`)
      .limit(1);

    if (!payment) return null;

    const wasAlreadyPaid = payment.status === "completed";

    await tx
      .update(paymentDetails)
      .set({
        razorpay_payment_id: params.razorpayPaymentId,
        status: "completed",
        payment_details: params.rawPaymentJson,
      })
      .where(eq(paymentDetails.id, payment.id));

    await tx
      .update(orders)
      .set({ status: "processing", payment_status: "paid" })
      .where(eq(orders.id, payment.order_id));

    const [shipping] = await tx
      .select({ email: shippingDetails.email })
      .from(shippingDetails)
      .where(eq(shippingDetails.order_id, payment.order_id))
      .limit(1);

    return {
      orderId: payment.order_id,
      email: shipping?.email ?? null,
      wasAlreadyPaid,
    };
  });
}

/**
 * Aggregated "everything we need to send a notification email/WhatsApp".
 * Pulls items + shipping + the public order_number in a single round trip
 * by id. Used after `markOrderPaid` returns.
 */
export type OrderNotificationData = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  totalAmount: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    size: string | null;
    variation: string | null;
    giftWrap: string;
  }>;
  shipping: {
    address: string | null;
    apartment: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    phone: string | null;
  } | null;
};

export async function getOrderForNotification(
  orderId: number,
): Promise<OrderNotificationData | null> {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  if (!order) return null;

  const [shippingRows, itemRows] = await Promise.all([
    db
      .select()
      .from(shippingDetails)
      .where(eq(shippingDetails.order_id, orderId))
      .limit(1),
    db
      .select()
      .from(orderItems)
      .where(eq(orderItems.order_id, orderId)),
  ]);
  const shipping = shippingRows[0] ?? null;

  return {
    orderNumber: order.order_number,
    customerName: shipping
      ? `${shipping.first_name ?? ""} ${shipping.last_name ?? ""}`.trim() ||
        "Customer"
      : "Customer",
    customerEmail: shipping?.email ?? "",
    customerPhone: shipping?.phone ?? null,
    totalAmount: Number(order.grand_total ?? 0),
    items: itemRows.map((it) => ({
      name: it.product_name ?? "Product",
      quantity: Number(it.quantity ?? 1),
      price: Number(it.price ?? 0),
      size: it.product_size,
      variation: it.variation_option,
      giftWrap: it.gift_wrap,
    })),
    shipping: shipping
      ? {
          address: shipping.address,
          apartment: shipping.apartment,
          city: shipping.city,
          state: shipping.state,
          pincode: shipping.pincode,
          phone: shipping.phone,
        }
      : null,
  };
}

/* ============================================================
   READS
   ============================================================ */

export type OrderSummary = {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  grandTotal: number;
  quantity: number;
  createdAt: Date | null;
  shipping: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    apartment: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
  } | null;
  items: Array<{
    productId: number | null;
    productName: string | null;
    productSize: string | null;
    quantity: number | null;
    price: number;
    variation: string | null;
    giftWrap: string;
  }>;
};

/**
 * Look up an order by Razorpay order id, scoped to a guest cookie or user id.
 * Returns null if no match (so a stranger can't read someone else's order).
 */
export async function getOrderByRazorpayId(params: {
  razorpayOrderId: string;
  guestId: string | null;
  userId: number | null;
}): Promise<OrderSummary | null> {
  const [paymentRow] = await db
    .select({
      orderId: paymentDetails.order_id,
    })
    .from(paymentDetails)
    .where(eq(paymentDetails.razorpay_order_id, params.razorpayOrderId))
    .orderBy(sql`${paymentDetails.id} DESC`)
    .limit(1);

  if (!paymentRow) return null;

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, paymentRow.orderId))
    .limit(1);

  if (!order) return null;

  // Owner check — only the matching cookie/user may read.
  const ownerOk =
    (params.userId != null && order.user_id === params.userId) ||
    (params.guestId != null && order.guest_id === params.guestId);
  if (!ownerOk) return null;

  const [shippingRows, itemRows] = await Promise.all([
    db
      .select()
      .from(shippingDetails)
      .where(eq(shippingDetails.order_id, order.id))
      .limit(1),
    db
      .select()
      .from(orderItems)
      .where(eq(orderItems.order_id, order.id)),
  ]);
  const shipping = shippingRows[0] ?? null;

  return {
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    paymentStatus: order.payment_status,
    grandTotal: Number(order.grand_total ?? 0),
    quantity: Number(order.quantity ?? 0),
    createdAt: order.created_at,
    shipping: shipping
      ? {
          firstName: shipping.first_name,
          lastName: shipping.last_name,
          email: shipping.email,
          phone: shipping.phone,
          address: shipping.address,
          apartment: shipping.apartment,
          city: shipping.city,
          state: shipping.state,
          pincode: shipping.pincode,
        }
      : null,
    items: itemRows.map((it) => ({
      productId: it.product_id,
      productName: it.product_name,
      productSize: it.product_size,
      quantity: it.quantity,
      price: Number(it.price ?? 0),
      variation: it.variation_option,
      giftWrap: it.gift_wrap,
    })),
  };
}

export async function markOrderFailed(
  razorpayOrderId: string,
  rawPaymentJson: string | null,
): Promise<void> {
  await db.transaction(async (tx) => {
    const [payment] = await tx
      .select()
      .from(paymentDetails)
      .where(eq(paymentDetails.razorpay_order_id, razorpayOrderId))
      .limit(1);
    if (!payment) return;

    await tx
      .update(paymentDetails)
      .set({ status: "failed", payment_details: rawPaymentJson })
      .where(eq(paymentDetails.id, payment.id));

    await tx
      .update(orders)
      .set({ payment_status: "failed" })
      .where(eq(orders.id, payment.order_id));
  });
}

/* ============================================================
   USER-SCOPED READS  (powering /dashboard/*)
   ============================================================ */

export type UserOrderListItem = {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  grandTotal: number;
  quantity: number;
  itemCount: number;
  createdAt: Date | null;
};

export type UserOrderListResult = {
  data: UserOrderListItem[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

/**
 * Paginated list of orders that belong to a single logged-in user.
 *
 * Sorted newest first. Includes a per-row `itemCount` (number of distinct
 * line items) so the dashboard can show "3 items" without loading the
 * order_items table for every row.
 */
export async function listUserOrders(params: {
  userId: number;
  page?: number;
  perPage?: number;
}): Promise<UserOrderListResult> {
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const perPage = Math.min(50, Math.max(1, Math.floor(params.perPage ?? 10)));

  const itemCountSql = sql<number>`(
    SELECT COUNT(*) FROM ${orderItems} oi
    WHERE oi.order_id = ${orders.id}
  )`;

  const [rows, totalRow] = await Promise.all([
    db
      .select({
        id: orders.id,
        orderNumber: orders.order_number,
        status: orders.status,
        paymentStatus: orders.payment_status,
        grandTotal: orders.grand_total,
        quantity: orders.quantity,
        createdAt: orders.created_at,
        itemCount: itemCountSql,
      })
      .from(orders)
      .where(eq(orders.user_id, params.userId))
      .orderBy(desc(orders.id))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db
      .select({ total: sql<number>`COUNT(*)` })
      .from(orders)
      .where(eq(orders.user_id, params.userId)),
  ]);

  const total = Number(totalRow[0]?.total ?? 0);

  return {
    data: rows.map((r) => ({
      id: r.id,
      orderNumber: r.orderNumber,
      status: r.status,
      paymentStatus: r.paymentStatus,
      grandTotal: Number(r.grandTotal ?? 0),
      quantity: Number(r.quantity ?? 0),
      itemCount: Number(r.itemCount ?? 0),
      createdAt: r.createdAt,
    })),
    page,
    perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

/**
 * Look up one order owned by `userId`, by its public `order_number`.
 * Returns null if the order does not exist OR it belongs to someone else
 * (so a stranger cannot read another customer's order via URL guessing).
 */
export async function getUserOrderByNumber(params: {
  userId: number;
  orderNumber: string;
}): Promise<OrderSummary | null> {
  const [order] = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.order_number, params.orderNumber),
        eq(orders.user_id, params.userId),
      ),
    )
    .limit(1);

  if (!order) return null;

  const [shippingRows, itemRows] = await Promise.all([
    db
      .select()
      .from(shippingDetails)
      .where(eq(shippingDetails.order_id, order.id))
      .limit(1),
    db
      .select()
      .from(orderItems)
      .where(eq(orderItems.order_id, order.id)),
  ]);
  const shipping = shippingRows[0] ?? null;

  return {
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    paymentStatus: order.payment_status,
    grandTotal: Number(order.grand_total ?? 0),
    quantity: Number(order.quantity ?? 0),
    createdAt: order.created_at,
    shipping: shipping
      ? {
          firstName: shipping.first_name,
          lastName: shipping.last_name,
          email: shipping.email,
          phone: shipping.phone,
          address: shipping.address,
          apartment: shipping.apartment,
          city: shipping.city,
          state: shipping.state,
          pincode: shipping.pincode,
        }
      : null,
    items: itemRows.map((it) => ({
      productId: it.product_id,
      productName: it.product_name,
      productSize: it.product_size,
      quantity: it.quantity,
      price: Number(it.price ?? 0),
      variation: it.variation_option,
      giftWrap: it.gift_wrap,
    })),
  };
}

export type UserSavedAddress = {
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  address: string | null;
  apartment: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  /** Most recent time we saw this address in an order. */
  lastUsedAt: Date | null;
};

/**
 * Best-effort "saved addresses" — we don't have a dedicated table for the
 * customer-facing addresses (Laravel never had one either), so we collect
 * the unique shipping addresses from this user's past orders, newest first.
 */
export async function listUserSavedAddresses(
  userId: number,
): Promise<UserSavedAddress[]> {
  const rows = await db
    .select({
      firstName: shippingDetails.first_name,
      lastName: shippingDetails.last_name,
      phone: shippingDetails.phone,
      address: shippingDetails.address,
      apartment: shippingDetails.apartment,
      city: shippingDetails.city,
      state: shippingDetails.state,
      pincode: shippingDetails.pincode,
      createdAt: shippingDetails.created_at,
    })
    .from(shippingDetails)
    .where(eq(shippingDetails.user_id, userId))
    .orderBy(desc(shippingDetails.id))
    .limit(50);

  // Deduplicate by (pincode + apartment + state) — same address typed twice
  // shouldn't appear twice on the dashboard.
  const seen = new Set<string>();
  const out: UserSavedAddress[] = [];
  for (const r of rows) {
    const key = [
      r.pincode ?? "",
      (r.apartment ?? "").trim().toLowerCase(),
      (r.address ?? "").trim().toLowerCase(),
      (r.state ?? "").trim().toLowerCase(),
    ].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...r, lastUsedAt: r.createdAt });
  }
  return out;
}

export type UserOrderStats = {
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  totalSpent: number;
};

export async function getUserOrderStats(
  userId: number,
): Promise<UserOrderStats> {
  const [row] = await db
    .select({
      totalOrders: sql<number>`COUNT(*)`,
      paidOrders: sql<number>`SUM(CASE WHEN ${orders.payment_status} = 'paid' THEN 1 ELSE 0 END)`,
      pendingOrders: sql<number>`SUM(CASE WHEN ${orders.payment_status} = 'pending' THEN 1 ELSE 0 END)`,
      totalSpent: sql<number>`COALESCE(SUM(CASE WHEN ${orders.payment_status} = 'paid' THEN ${orders.grand_total} ELSE 0 END), 0)`,
    })
    .from(orders)
    .where(eq(orders.user_id, userId));

  return {
    totalOrders: Number(row?.totalOrders ?? 0),
    paidOrders: Number(row?.paidOrders ?? 0),
    pendingOrders: Number(row?.pendingOrders ?? 0),
    totalSpent: Number(row?.totalSpent ?? 0),
  };
}
