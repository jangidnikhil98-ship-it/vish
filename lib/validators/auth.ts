import { z } from "zod";

const emailRule = z
  .string({ message: "Please enter an email" })
  .trim()
  .min(1, "Please enter an email")
  .email("Please enter a valid email address")
  .max(255)
  .transform((s) => s.toLowerCase());

const passwordRule = z
  .string({ message: "Please enter a password" })
  .min(8, "Your password must be at least 8 characters long")
  .max(72); // bcrypt's hard limit

const nameRule = z
  .string()
  .trim()
  .min(1)
  .max(100);

export const loginSchema = z.object({
  email: emailRule,
  password: z
    .string({ message: "Please enter a password" })
    .min(1, "Please enter a password")
    .max(72),
});

export const registerSchema = z.object({
  first_name: nameRule.refine((v) => v.length > 0, {
    message: "Please enter your first name",
  }),
  last_name: nameRule.refine((v) => v.length > 0, {
    message: "Please enter your last name",
  }),
  email: emailRule,
  password: passwordRule,
});

export const forgotPasswordSchema = z.object({
  email: emailRule,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(10, "Invalid or expired reset link"),
    password: passwordRule,
    repeatPassword: passwordRule,
  })
  .refine((d) => d.password === d.repeatPassword, {
    message: "Passwords do not match",
    path: ["repeatPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
