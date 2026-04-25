import { z } from "zod";

export const PRODUCT_TYPES = [
  "bestseller",
  "birthday",
  "wedding-anniversary",
  "mothers-day",
  "fathers-day",
  "teachers-day",
  "natural-wooden-slice",
  "rectangle-wooden-frame",
] as const;

export type ProductType = (typeof PRODUCT_TYPES)[number];

export const productListQuerySchema = z.object({
  type: z.enum(PRODUCT_TYPES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(64).default(16),
});

export const searchQuerySchema = z.object({
  q: z.string().trim().min(2, "Min 2 characters").max(100),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
