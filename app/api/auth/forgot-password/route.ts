import { NextResponse } from "next/server";
import { handleError } from "@/lib/api";
import { generateResetToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import {
  getUserByEmail,
  upsertPasswordResetToken,
} from "@/lib/queries/users";
import { forgotPasswordSchema } from "@/lib/validators/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      return NextResponse.json(
        { success: false, message: "Validation failed", errors },
        { status: 422 },
      );
    }

    const { email } = parsed.data;
    const user = await getUserByEmail(email);

    // Only do the work if the user exists, but ALWAYS return the same
    // success response so attackers can't enumerate registered emails.
    if (user && Number(user.is_active) === 1) {
      const { token, hash } = generateResetToken();
      await upsertPasswordResetToken({ email: user.email, tokenHash: hash });

      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
      const resetUrl = `${baseUrl}/reset-password/${encodeURIComponent(
        token,
      )}?email=${encodeURIComponent(user.email)}`;

      try {
        await sendPasswordResetEmail({
          to: user.email,
          firstName: user.first_name,
          resetUrl,
        });
      } catch (mailErr) {
        console.warn("[forgot-password] failed to send email:", mailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message:
        "If an account exists for that email, we've sent a password reset link.",
    });
  } catch (err) {
    return handleError(err);
  }
}
