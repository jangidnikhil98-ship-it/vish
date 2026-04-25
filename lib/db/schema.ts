/**
 * Drizzle schema — translated 1:1 from the Laravel migrations in
 * vish-laravel-development/database/migrations.
 *
 * Column names, types, defaults, indexes and enums match the live MySQL
 * schema exactly so queries written against this file work against your
 * existing data without any data migration step.
 *
 * NOTE: The `ratting` table name keeps the original spelling from the
 * Laravel migration (`2025_07_10_061017_create_ratting_table.php`).
 */

import { sql } from "drizzle-orm";
import {
  bigint,
  decimal,
  index,
  int,
  longtext,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  tinyint,
  uniqueIndex,
  varchar,
  date,
} from "drizzle-orm/mysql-core";

/* ============================================================
   USERS
   ============================================================ */
export const users = mysqlTable(
  "users",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),
    first_name: varchar("first_name", { length: 100 }).notNull(),
    last_name: varchar("last_name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    password: varchar("password", { length: 255 }),
    profile_img: varchar("profile_img", { length: 255 }),
    phone: varchar("phone", { length: 15 }),
    is_active: tinyint("is_active", { unsigned: true }).default(1).notNull(),
    is_email_verify: tinyint("is_email_verify", { unsigned: true })
      .default(1)
      .notNull(),
    /**
     * Role-based access. The Laravel app referenced `users.role` from
     * the admin header and the `role:admin` middleware, but the original
     * users migration never declared it — so production already has it
     * added manually. We mirror that here. Use 'admin' for backoffice
     * staff and 'user' for everyone else.
     */
    role: varchar("role", { length: 32 }).default("user").notNull(),
    /**
     * Optional profile fields used by the admin panel "Edit User" + admin
     * Settings page. The original Laravel migration didn't define these
     * but the Blade views read them, so production added them by hand.
     */
    city: varchar("city", { length: 255 }),
    country_code: varchar("country_code", { length: 8 }),
    company_name: varchar("company_name", { length: 255 }),
    last_login_at: timestamp("last_login_at"),
    remember_token: varchar("remember_token", { length: 100 }),
    deleted_at: timestamp("deleted_at"),
    created_at: timestamp("created_at"),
    updated_at: timestamp("updated_at"),
  },
  (t) => [
    uniqueIndex("users_email_unique").on(t.email),
    index("idx_users_role").on(t.role),
  ],
);

/* ============================================================
   PASSWORD RESET TOKENS
   ============================================================ */
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  email: varchar("email", { length: 255 }).primaryKey(),
  token: varchar("token", { length: 255 }).notNull(),
  created_at: timestamp("created_at"),
});

/* ============================================================
   PERSONAL ACCESS TOKENS (Sanctum)
   ============================================================ */
export const personalAccessTokens = mysqlTable(
  "personal_access_tokens",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),
    tokenable_type: varchar("tokenable_type", { length: 255 }).notNull(),
    tokenable_id: bigint("tokenable_id", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    token: varchar("token", { length: 64 }).notNull(),
    abilities: text("abilities"),
    last_used_at: timestamp("last_used_at"),
    expires_at: timestamp("expires_at"),
    created_at: timestamp("created_at"),
    updated_at: timestamp("updated_at"),
  },
  (t) => [
    uniqueIndex("personal_access_tokens_token_unique").on(t.token),
    index("personal_access_tokens_tokenable").on(
      t.tokenable_type,
      t.tokenable_id,
    ),
  ],
);

/* ============================================================
   FAILED JOBS
   ============================================================ */
export const failedJobs = mysqlTable(
  "failed_jobs",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),
    uuid: varchar("uuid", { length: 255 }).notNull(),
    connection: text("connection").notNull(),
    queue: text("queue").notNull(),
    payload: longtext("payload").notNull(),
    exception: longtext("exception").notNull(),
    failed_at: timestamp("failed_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (t) => [uniqueIndex("failed_jobs_uuid_unique").on(t.uuid)],
);

/* ============================================================
   PRODUCTS
   ============================================================ */
export const products = mysqlTable(
  "products",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),
    sku: varchar("sku", { length: 255 }),
    product_type: varchar("product_type", { length: 255 }),
    product_for: varchar("product_for", { length: 255 }),
    product_name: varchar("product_name", { length: 191 }),
    product_name_slug: varchar("product_name_slug", { length: 191 }),
    description: text("description"),
    weight: decimal("weight", { precision: 15, scale: 2 }),
    price: decimal("price", { precision: 15, scale: 2 }),
    discount: int("discount").default(0).notNull(),
    width: int("width"),
    height: varchar("height", { length: 255 }),
    stock_quantity: int("stock_quantity"),
    status: mysqlEnum("status", ["active", "inactive"])
      .default("inactive")
      .notNull(),
    deleted_at: timestamp("deleted_at"),
    created_at: timestamp("created_at"),
    updated_at: timestamp("updated_at"),
  },
  (t) => [
    uniqueIndex("products_product_name_slug_unique").on(t.product_name_slug),
    index("idx_products_status").on(t.status),
    index("idx_products_status_id").on(t.status, t.id),
    index("idx_products_for").on(t.product_for),
  ],
);

/* ============================================================
   PRODUCT IMAGES
   image_type: 1 = main image, 2 = additional image
   ============================================================ */
export const productImages = mysqlTable(
  "product_images",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),
    product_id: bigint("product_id", { mode: "number", unsigned: true }),
    image_url: varchar("image_url", { length: 255 }),
    image_type: tinyint("image_type").default(1).notNull(),
    created_at: timestamp("created_at"),
    updated_at: timestamp("updated_at"),
  },
  (t) => [
    index("idx_product_images_product").on(t.product_id),
    index("idx_product_images_type").on(t.product_id, t.image_type),
  ],
);

/* ============================================================
   PRODUCT SIZES
   ============================================================ */
export const productSizes = mysqlTable(
  "product_sizes",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),
    product_id: bigint("product_id", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    label: varchar("label", { length: 255 }),
    value: varchar("value", { length: 255 }),
    price: decimal("price", { precision: 10, scale: 2 }).default("0").notNull(),
    final_price: decimal("final_price", { precision: 10, scale: 2 })
      .default("0")
      .notNull(),
    discount: int("discount").default(0).notNull(),
    is_default: tinyint("is_default", { unsigned: true }).default(0).notNull(),
    created_at: timestamp("created_at"),
    updated_at: timestamp("updated_at"),
  },
  (t) => [
    index("idx_product_sizes_product").on(t.product_id),
    index("idx_product_sizes_default").on(t.product_id, t.is_default),
  ],
);

/* ============================================================
   RATTING (sic — preserves the original Laravel table name)
   ============================================================ */
export const ratting = mysqlTable(
  "ratting",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),
    user_id: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
    first_name: varchar("first_name", { length: 255 }),
    last_name: varchar("last_name", { length: 255 }),
    product_id: bigint("product_id", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    rating: tinyint("rating").notNull(),
    comment: text("comment"),
    created_at: timestamp("created_at"),
    updated_at: timestamp("updated_at"),
  },
  (t) => [
    index("idx_ratting_product").on(t.product_id),
    index("idx_ratting_user").on(t.user_id),
  ],
);

/* ============================================================
   BLOGS
   ============================================================ */
export const blogs = mysqlTable(
  "blogs",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),
    title: varchar("title", { length: 255 }),
    description: text("description"),
    image: varchar("image", { length: 255 }),
    slug: varchar("slug", { length: 255 }),
    published_date: date("published_date"),
    is_active: tinyint("is_active", { unsigned: true }).default(1).notNull(),
    created_at: timestamp("created_at"),
    updated_at: timestamp("updated_at"),
  },
  (t) => [
    index("idx_blogs_slug").on(t.slug),
    index("idx_blogs_active_id").on(t.is_active, t.id),
  ],
);

/* ============================================================
   ENQUIRIES (contact form submissions)
   ============================================================ */
export const enquiries = mysqlTable("enquiries", {
  id: bigint("id", { mode: "number", unsigned: true })
    .autoincrement()
    .primaryKey(),
  full_name: varchar("full_name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 255 }),
  message: text("message"),
  created_at: timestamp("created_at"),
  updated_at: timestamp("updated_at"),
});

/* ============================================================
   ORDERS
   ============================================================ */
export const orders = mysqlTable(
  "orders",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),
    user_id: bigint("user_id", { mode: "number", unsigned: true }),
    guest_id: varchar("guest_id", { length: 255 }),
    order_number: varchar("order_number", { length: 255 }).notNull(),
    status: mysqlEnum("status", [
      "pending",
      "processing",
      "completed",
      "cancelled",
    ])
      .default("pending")
      .notNull(),
    grand_total: decimal("grand_total", { precision: 10, scale: 2 }),
    quantity: int("quantity", { unsigned: true }),
    payment_status: mysqlEnum("payment_status", ["pending", "paid", "failed"])
      .default("pending")
      .notNull(),
    created_at: timestamp("created_at"),
    updated_at: timestamp("updated_at"),
  },
  (t) => [
    uniqueIndex("orders_order_number_unique").on(t.order_number),
    index("idx_orders_user").on(t.user_id),
    index("idx_orders_user_created").on(t.user_id, t.created_at),
  ],
);

/* ============================================================
   ORDER ITEMS
   ============================================================ */
export const orderItems = mysqlTable(
  "order_items",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),
    order_id: bigint("order_id", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    product_id: bigint("product_id", { mode: "number", unsigned: true }),
    product_name: varchar("product_name", { length: 255 }),
    price: decimal("price", { precision: 10, scale: 2 }),
    quantity: int("quantity"),
    variation_option: varchar("variation_option", { length: 255 }),
    product_size: varchar("product_size", { length: 255 }),
    gift_wrap: mysqlEnum("gift_wrap", ["yes", "no"]).default("no").notNull(),
    back_image: text("back_image"),
    back_text: text("back_text"),
    front_image: text("front_image"),
    front_text: text("front_text"),
    created_at: timestamp("created_at"),
    updated_at: timestamp("updated_at"),
  },
  (t) => [index("idx_order_items_order").on(t.order_id)],
);

/* ============================================================
   SHIPPING DETAILS
   ============================================================ */
export const shippingDetails = mysqlTable(
  "shipping_details",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),
    order_id: bigint("order_id", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    user_id: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
    guest_id: varchar("guest_id", { length: 255 }),
    first_name: varchar("first_name", { length: 255 }),
    last_name: varchar("last_name", { length: 255 }),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 255 }),
    address: varchar("address", { length: 255 }),
    apartment: varchar("apartment", { length: 255 }),
    city: varchar("city", { length: 255 }),
    state: varchar("state", { length: 255 }),
    pincode: varchar("pincode", { length: 6 }).notNull(),
    is_save: tinyint("is_save", { unsigned: true }).default(0).notNull(),
    created_at: timestamp("created_at"),
    updated_at: timestamp("updated_at"),
  },
  (t) => [
    index("idx_shipping_order").on(t.order_id),
    index("idx_shipping_user").on(t.user_id),
  ],
);

/* ============================================================
   BILLING ADDRESS
   ============================================================ */
export const billingAddress = mysqlTable(
  "billing_address",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),
    user_id: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
    first_name: varchar("first_name", { length: 100 }).notNull(),
    last_name: varchar("last_name", { length: 100 }).notNull(),
    address_info: varchar("address_info", { length: 255 }),
    city: varchar("city", { length: 255 }),
    state: varchar("state", { length: 255 }),
    pincode_code: varchar("pincode_code", { length: 255 }),
    phone_number: varchar("phone_number", { length: 255 }),
    deleted_at: timestamp("deleted_at"),
    created_at: timestamp("created_at"),
    updated_at: timestamp("updated_at"),
  },
  (t) => [index("idx_billing_user").on(t.user_id)],
);

/* ============================================================
   BASKET (server-side persisted cart)
   ============================================================ */
export const basket = mysqlTable(
  "basket",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),
    guest_id: varchar("guest_id", { length: 255 }),
    user_id: varchar("user_id", { length: 255 }),
    product_id: bigint("product_id", { mode: "number", unsigned: true }),
    address_id: bigint("address_id", { mode: "number", unsigned: true }),
    quantity: int("quantity"),
    price: decimal("price", { precision: 10, scale: 2 }),
    product_type: varchar("product_type", { length: 255 }),
    product_size: varchar("product_size", { length: 255 }),
    front_image_url: varchar("front_image_url", { length: 255 }),
    back_image_url: varchar("back_image_url", { length: 255 }),
    front_print_text: varchar("front_print_text", { length: 255 }),
    back_print_text: varchar("back_print_text", { length: 255 }),
    product_mode: mysqlEnum("product_mode", ["basket", "buy_now"])
      .default("basket")
      .notNull(),
    created_at: timestamp("created_at"),
    updated_at: timestamp("updated_at"),
  },
  (t) => [
    index("idx_basket_user").on(t.user_id),
    index("idx_basket_guest").on(t.guest_id),
    index("idx_basket_product").on(t.product_id),
  ],
);

/* ============================================================
   PAYMENT DETAILS
   ============================================================ */
export const paymentDetails = mysqlTable(
  "payment_details",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),
    order_id: bigint("order_id", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    payment_method: varchar("payment_method", { length: 255 }),
    amount: decimal("amount", { precision: 10, scale: 2 }),
    razorpay_order_id: varchar("razorpay_order_id", { length: 255 }),
    razorpay_payment_id: varchar("razorpay_payment_id", { length: 255 }),
    status: mysqlEnum("status", ["created", "completed", "failed"]).notNull(),
    payment_details: text("payment_details"),
    created_at: timestamp("created_at"),
    updated_at: timestamp("updated_at"),
  },
  (t) => [index("idx_payment_order").on(t.order_id)],
);

/* ============================================================
   TRANSACTION HISTORIES
   ============================================================ */
export const transactionHistories = mysqlTable(
  "transaction_histories",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),
    order_id: bigint("order_id", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    payment_method: varchar("payment_method", { length: 255 }).notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    razorpay_order_id: varchar("razorpay_order_id", { length: 255 }),
    razorpay_payment_id: varchar("razorpay_payment_id", { length: 255 }),
    status: mysqlEnum("status", ["created", "completed", "failed"]).notNull(),
    payment_details: text("payment_details"),
    created_at: timestamp("created_at"),
    updated_at: timestamp("updated_at"),
  },
  (t) => [index("idx_txn_order").on(t.order_id)],
);

/* ============================================================
   FAVOURITES PRODUCTS
   ============================================================ */
export const favouritesProducts = mysqlTable(
  "favourites_products",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),
    user_id: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
    product_id: bigint("product_id", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    created_at: timestamp("created_at"),
    updated_at: timestamp("updated_at"),
  },
  (t) => [
    index("idx_favourites_user").on(t.user_id),
    index("idx_favourites_product").on(t.product_id),
    index("idx_favourites_user_product").on(t.user_id, t.product_id),
  ],
);

/* ============================================================
   SEARCH HISTORY
   ============================================================ */
export const searchHistory = mysqlTable(
  "search_history",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),
    query: varchar("query", { length: 255 }),
    user_id: bigint("user_id", { mode: "number", unsigned: true }),
    created_at: timestamp("created_at"),
    updated_at: timestamp("updated_at"),
  },
  (t) => [index("idx_search_user").on(t.user_id)],
);

/* ============================================================
   EMAIL TEMPLATE
   ============================================================ */
export const emailTemplate = mysqlTable("email_template", {
  id: bigint("id", { mode: "number", unsigned: true })
    .autoincrement()
    .primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  type: varchar("type", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  content: text("content").notNull(),
  keywords: varchar("keywords", { length: 500 }).notNull(),
  is_status: tinyint("is_status").default(1).notNull(),
  created_at: timestamp("created_at"),
  updated_at: timestamp("updated_at"),
});

/* ============================================================
   TYPES
   ============================================================ */
export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductImage = typeof productImages.$inferSelect;
export type ProductSize = typeof productSizes.$inferSelect;
export type Ratting = typeof ratting.$inferSelect;
export type Blog = typeof blogs.$inferSelect;
export type Enquiry = typeof enquiries.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type ShippingDetails = typeof shippingDetails.$inferSelect;
export type BillingAddress = typeof billingAddress.$inferSelect;
export type BasketItem = typeof basket.$inferSelect;
export type PaymentDetail = typeof paymentDetails.$inferSelect;
export type TransactionHistory = typeof transactionHistories.$inferSelect;
export type Favourite = typeof favouritesProducts.$inferSelect;
export type SearchHistoryRow = typeof searchHistory.$inferSelect;
export type EmailTemplateRow = typeof emailTemplate.$inferSelect;
