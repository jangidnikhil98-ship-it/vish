import { NextResponse } from "next/server";
import { fail, handleError } from "@/lib/api";
import {
  hashPassword,
  hashResetToken,
  isResetTokenExpired,
} from "@/lib/auth";
import {
  deletePasswordResetByEmail,
  getPasswordResetByHash,
  getUserByEmail,
  updatePassword,
} from "@/lib/queries/users";
import { resetPasswordSchema } from "@/lib/validators/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      return NextResponse.json(
        { success: false, message: "Validation failed", errors },
        { status: 422 },
      );
    }

    const { token, password } = parsed.data;

    const tokenHash = hashResetToken(token);
    const record = await getPasswordResetByHash(tokenHash);
    if (!record) {
      return fail("This password reset link is invalid or has been used.", 400);
    }
    if (isResetTokenExpired(record.created_at)) {
      // Clean up so it can't be retried.
      deletePasswordResetByEmail(record.email).catch(() => {});
      return fail("This password reset link has expired.", 400);
    }

    const user = await getUserByEmail(record.email);
    if (!user) {
      return fail("Account not found.", 404);
    }

    const passwordHash = await hashPassword(password);
    await updatePassword({ userId: user.id, passwordHash });
    await deletePasswordResetByEmail(record.email);

    return NextResponse.json({
      success: true,
      message: "Password updated successfully. You can now log in.",
    });
  } catch (err) {
    return handleError(err);
  }
}
