import { NextResponse } from "next/server";
import { fail, handleError } from "@/lib/api";
import { createSession, hashPassword } from "@/lib/auth";
import { createUser, getUserByEmail } from "@/lib/queries/users";
import { registerSchema } from "@/lib/validators/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      return NextResponse.json(
        { success: false, message: "Validation failed", errors },
        { status: 422 },
      );
    }

    const { first_name, last_name, email, password } = parsed.data;

    const existing = await getUserByEmail(email);
    if (existing) {
      return fail("An account with this email already exists.", 409);
    }

    const passwordHash = await hashPassword(password);
    const userId = await createUser({
      first_name,
      last_name,
      email,
      passwordHash,
    });

    await createSession({ sub: userId, email });

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      redirect: "/",
      data: {
        id: userId,
        first_name,
        last_name,
        email,
      },
    });
  } catch (err) {
    return handleError(err);
  }
}
