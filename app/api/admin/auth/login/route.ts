import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyPassword } from "@/lib/auth";
import {
  createAdminSession,
  destroyAdminSession,
} from "@/lib/admin-auth";
import {
  getUserByEmail,
  touchLastLogin,
} from "@/lib/queries/users";

/**
 * POST /api/admin/auth/login
 *
 * Body: { email, password }
 *
 * Mirrors the original `App\Http\Controllers\Backend\Auth\LoginController::login`
 * behaviour — except that we explicitly verify `role === 'admin'`. The
 * original Laravel code relied on a `role:admin` middleware that, due to a
 * bug in `RoleMiddleware`, never actually rejected anyone for `admin`.
 */

const loginSchema = z.object({
  email: z
    .string({ message: "Please enter an email" })
    .trim()
    .min(1, "Please enter an email")
    .email("Please enter a valid email address")
    .max(255)
    .transform((s) => s.toLowerCase()),
  password: z
    .string({ message: "Please enter a password" })
    .min(1, "Please enter a password")
    .max(72),
});

export async function POST(req: Request) {
  let raw: unknown;
  try {
    const ctype = req.headers.get("content-type") ?? "";
    if (ctype.includes("application/json")) {
      raw = await req.json();
    } else {
      const form = await req.formData();
      raw = Object.fromEntries(form.entries());
    }
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString() ?? "_";
      (errors[key] ??= []).push(issue.message);
    }
    return NextResponse.json(
      { success: false, message: "Validation failed.", errors },
      { status: 422 },
    );
  }

  const { email, password } = parsed.data;

  // Generic message for failed login — never disclose whether the email exists.
  const incorrect = NextResponse.json({
    success: false,
    message: "Incorrect email or password.",
  });

  const user = await getUserByEmail(email);
  if (!user) return incorrect;

  if (!(await verifyPassword(password, user.password))) return incorrect;

  if (!user.is_active) {
    await destroyAdminSession();
    return NextResponse.json(
      {
        success: false,
        message: "Your account is inactive. Please contact support.",
      },
      { status: 404 },
    );
  }

  if (user.role !== "admin") {
    // Don't tell them why — looks like a bad password to non-admins.
    return incorrect;
  }

  await createAdminSession({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
  await touchLastLogin(user.id);

  return NextResponse.json({
    success: true,
    redirect_url: "/admin/dashboard",
    message: "You are logged in as Admin!",
  });
}
