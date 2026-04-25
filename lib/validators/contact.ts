import { z } from "zod";

/** Mirrors the Laravel validation in PageController@contactusSubmit */
export const contactSchema = z.object({
  full_name: z.string().trim().min(1, "Full name is required").max(255),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Phone must be exactly 10 digits"),
  message: z.string().trim().min(1, "Message is required").max(5000),
});

export type ContactInput = z.infer<typeof contactSchema>;
