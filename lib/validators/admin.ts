import { z } from "zod";

/* ============================================================
   USERS
   ============================================================ */
export const adminUserUpdateSchema = z.object({
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(8).max(15).regex(/^\d+$/),
  city: z.string().trim().max(255).optional().or(z.literal("")),
  country_code: z
    .string()
    .trim()
    .max(8)
    .regex(/^\d*$/)
    .optional()
    .or(z.literal("")),
});
export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>;

/* ============================================================
   ORDERS
   ============================================================ */
export const adminOrderStatusSchema = z.object({
  status: z.enum(["pending", "processing", "completed", "cancelled"]),
});

/* ============================================================
   PRODUCTS
   ============================================================ */
const productSizeSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  label: z.string().trim().min(1).max(255),
  value: z.string().trim().min(1).max(255),
  price: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).max(100).default(0),
});
export type AdminProductSizeInput = z.infer<typeof productSizeSchema>;

export const adminProductCreateSchema = z.object({
  productName: z.string().trim().min(1).max(255),
  description: z.string().trim().min(1),
  product_type: z.string().trim().min(1).max(100),
  product_for: z.enum(["round", "square"]),
  weight: z.coerce.number().min(0),
  stock_quantity: z.coerce.number().int().min(0),
  is_active: z.coerce.number().refine((n) => n === 0 || n === 1, "0 or 1"),
  default_size: z.coerce.number().int().min(0),
  sizes: z.array(productSizeSchema).min(1),
});
export type AdminProductCreateInput = z.infer<typeof adminProductCreateSchema>;

export const adminProductUpdateSchema = adminProductCreateSchema.partial({
  product_for: true,
});
export type AdminProductUpdateInput = z.infer<typeof adminProductUpdateSchema>;

/* ============================================================
   COUPONS
   ============================================================ */
/**
 * "code" rules:
 *   - 2..32 chars, ASCII letters/digits/underscore/hyphen only.
 *   - We always uppercase server-side so DIWALI20 == diwali20.
 */
const couponCodeRegex = /^[A-Z0-9_-]{2,32}$/;

/** Optional ISO date-time string (YYYY-MM-DDTHH:mm or YYYY-MM-DD). */
const optionalDateTime = z
  .string()
  .trim()
  .max(25)
  .optional()
  .or(z.literal(""))
  .transform((v) => (v && v.length > 0 ? v : null));

export const adminCouponCreateSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(
        couponCodeRegex,
        "Code must be 2–32 characters; letters, digits, underscore or hyphen only",
      ),
    type: z.enum(["percent", "free_shipping"]),
    /** % off (1–100) when type=percent; 0 when type=free_shipping. */
    value: z.coerce.number().min(0).max(100),
    min_order_amount: z.coerce.number().min(0).default(0),
    /** null/blank = no cap. */
    max_discount_amount: z
      .union([z.coerce.number().min(0), z.literal(""), z.null()])
      .optional()
      .transform((v) =>
        v === "" || v === null || v === undefined ? null : Number(v),
      ),
    /** null/blank = unlimited. */
    usage_limit: z
      .union([z.coerce.number().int().min(1), z.literal(""), z.null()])
      .optional()
      .transform((v) =>
        v === "" || v === null || v === undefined ? null : Number(v),
      ),
    description: z.string().trim().max(255).optional().or(z.literal("")),
    valid_from: optionalDateTime,
    valid_until: optionalDateTime,
    is_active: z.coerce.number().refine((n) => n === 0 || n === 1, "0 or 1"),
  })
  .refine(
    (d) => (d.type === "percent" ? d.value > 0 && d.value <= 100 : true),
    {
      path: ["value"],
      message: "Percent coupons need a value between 1 and 100.",
    },
  )
  .refine(
    (d) =>
      !d.valid_from ||
      !d.valid_until ||
      new Date(d.valid_from) <= new Date(d.valid_until),
    {
      path: ["valid_until"],
      message: "Valid until must be after valid from.",
    },
  );

export type AdminCouponCreateInput = z.infer<typeof adminCouponCreateSchema>;

/* ============================================================
   SITE SETTINGS (admin can edit a flat list of key/value pairs)
   ============================================================ */
export const adminSettingsKVSchema = z.object({
  cod_enabled: z.coerce.number().refine((n) => n === 0 || n === 1, "0 or 1"),
  cod_fee: z.coerce.number().min(0).max(10000),
  cod_min_order_amount: z.coerce.number().min(0),
  cod_max_order_amount: z.coerce.number().min(0),
  default_shipping_fee: z.coerce.number().min(0),
  shiprocket_pickup_location: z.string().trim().min(1).max(100),
  shiprocket_default_weight_kg: z.coerce.number().min(0.01).max(50),
  shiprocket_default_length_cm: z.coerce.number().min(1).max(200),
  shiprocket_default_breadth_cm: z.coerce.number().min(1).max(200),
  shiprocket_default_height_cm: z.coerce.number().min(1).max(200),
  shiprocket_auto_create_order: z
    .coerce.number()
    .refine((n) => n === 0 || n === 1, "0 or 1"),
});
export type AdminSettingsKVInput = z.infer<typeof adminSettingsKVSchema>;

/* ============================================================
   BLOGS
   ============================================================ */
export const adminBlogCreateSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().min(1),
  published_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  is_active: z.coerce.number().refine((n) => n === 0 || n === 1, "0 or 1"),
});
export type AdminBlogCreateInput = z.infer<typeof adminBlogCreateSchema>;

/* ============================================================
   SETTINGS (own profile + password)
   ============================================================ */
export const adminProfileUpdateSchema = z.object({
  company_name: z.string().trim().max(255).optional().or(z.literal("")),
  first_name: z
    .string()
    .trim()
    .regex(/^[a-zA-Z]+$/, "Only letters allowed")
    .min(1)
    .max(100),
  last_name: z
    .string()
    .trim()
    .regex(/^[a-zA-Z]+$/, "Only letters allowed")
    .min(1)
    .max(100),
});
export type AdminProfileUpdateInput = z.infer<
  typeof adminProfileUpdateSchema
>;

export const adminPasswordUpdateSchema = z
  .object({
    old_password: z.string().min(1),
    password: z.string().min(8),
    password_confirmation: z.string().min(8),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });
export type AdminPasswordUpdateInput = z.infer<
  typeof adminPasswordUpdateSchema
>;
