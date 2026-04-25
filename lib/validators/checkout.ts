import { z } from "zod";

/**
 * A single line in the cart that the client posts when starting checkout.
 *
 * NOTE on prices: the client's price is intentionally ignored on the server.
 * The server re-fetches `product_sizes.final_price` from the DB so a tampered
 * client cannot pay less than the listed price.
 */
export const cartItemSchema = z.object({
  productId: z.coerce.number().int().positive(),
  productType: z.string().trim().max(255).optional(),
  sizeId: z.coerce.number().int().positive().optional(),
  productSize: z.string().trim().max(255).optional(),
  variation: z.enum(["one_side", "both_sides"]).optional(),
  giftWrapping: z.enum(["yes", "no"]).default("no"),
  frontMessage: z.string().trim().max(500).optional(),
  backMessage: z.string().trim().max(500).optional(),
  frontImageUrl: z.string().trim().max(500).optional(),
  backImageUrl: z.string().trim().max(500).optional(),
  quantity: z.coerce.number().int().min(1).max(99),
});

export type CartItemInput = z.infer<typeof cartItemSchema>;

export const shippingSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(255),
  last_name: z.string().trim().max(255).optional().default(""),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Phone must be exactly 10 digits"),
  address: z.string().trim().max(255).optional().default(""),
  apartment: z.string().trim().max(255).optional().default(""),
  city: z.string().trim().max(255).optional().default(""),
  state: z.string().trim().min(1, "State is required").max(255),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Pincode must be exactly 6 digits"),
  is_save: z.coerce.boolean().optional().default(false),
});

export type ShippingInput = z.infer<typeof shippingSchema>;

export const createOrderSchema = z.object({
  shipping: shippingSchema,
  items: z.array(cartItemSchema).min(1, "Cart is empty"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().trim().min(1),
  razorpay_payment_id: z.string().trim().min(1),
  razorpay_signature: z.string().trim().min(1),
});

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
