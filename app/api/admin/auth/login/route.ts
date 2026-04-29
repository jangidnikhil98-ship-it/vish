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

/**
 * Dev-only diagnostic logger. Prints WHY an admin login attempt failed so
 * the developer can tell "no such user" from "bad password" from "not an
 * admin" from "inactive". Stripped in production so we never leak which
 * emails exist in our database.
 */
function devLog(reason: string, email: string) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[admin-login] ${reason} (email=${email})`);
  }
}

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

  // Generic 401 for the "credentials don't match" cases. Same response
  // body and status whether the email is unknown, the password is wrong,
  // or the account is real but not an admin — we deliberately avoid
  // leaking which one to attackers.
  const incorrect = () =>
    NextResponse.json(
      { success: false, message: "Incorrect email or password." },
      { status: 401 },
    );

  const user = await getUserByEmail(email);
  if (!user) {
    devLog("no user with that email", email);
    return incorrect();
  }

  if (!(await verifyPassword(password, user.password))) {
    devLog("password mismatch", email);
    return incorrect();
  }

  if (!user.is_active) {
    devLog("account is inactive (is_active=0)", email);
    await destroyAdminSession();
    return NextResponse.json(
      {
        success: false,
        message: "Your account is inactive. Please contact support.",
      },
      { status: 403 },
    );
  }

  if (user.role !== "admin") {
    devLog(`user is not an admin (role=${user.role})`, email);
    return incorrect();
  }

  await createAdminSession({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
  await touchLastLogin(user.id);

  if (process.env.NODE_ENV !== "production") {
    console.info(`[admin-login] success (email=${email})`);
  }

  return NextResponse.json({
    success: true,
    redirect_url: "/admin/dashboard",
    message: "You are logged in as Admin!",
  });
}
