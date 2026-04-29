import { NextResponse } from "next/server";
import { fail, handleError } from "@/lib/api";
import { createSession, verifyPassword } from "@/lib/auth";
import { getUserByEmail, touchLastLogin } from "@/lib/queries/users";
import { loginSchema } from "@/lib/validators/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Dev-only diagnostic logger. The HTTP response intentionally never says
 * which leg of the auth chain failed (so attackers can't enumerate users
 * or guess passwords from response bodies). This makes life painful in
 * development, so we log the reason server-side under NODE_ENV !== production.
 */
function devLog(reason: string, email: string) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[user-login] ${reason} (email=${email})`);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      return NextResponse.json(
        { success: false, message: "Validation failed", errors },
        { status: 422 },
      );
    }

    const { email, password } = parsed.data;
    const user = await getUserByEmail(email);

    // Run bcrypt even on a missing user, so timing doesn't leak whether
    // an account exists.
    const ok = await verifyPassword(password, user?.password ?? null);
    if (!user || !ok) {
      devLog(
        !user ? "no user with that email" : "password mismatch",
        email,
      );
      return fail("The provided credentials do not match our records.", 401);
    }

    if (Number(user.is_active) !== 1) {
      devLog("account is inactive (is_active=0)", email);
      // 403 Forbidden is the correct semantic — the account exists but is
      // not allowed to authenticate. (The previous 404 broke client code
      // that treated 404 as "endpoint missing".)
      return fail("Your account is inactive. Please contact support.", 403);
    }
    if (Number(user.is_email_verify) !== 1) {
      devLog("email not verified (is_email_verify=0)", email);
      return fail(
        "Your account is not verified yet. Please verify your email.",
        403,
      );
    }

    await createSession({ sub: user.id, email: user.email });
    // Best-effort, don't fail login if it errors.
    touchLastLogin(user.id).catch(() => {});

    if (process.env.NODE_ENV !== "production") {
      console.info(`[user-login] success (email=${email})`);
    }

    return NextResponse.json({
      success: true,
      message: "Login successful",
      redirect: "/",
      data: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (err) {
    return handleError(err);
  }
}
