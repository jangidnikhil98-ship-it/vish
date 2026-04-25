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
