import "server-only";
import type { NextRequest } from "next/server";

import { fail, handleError, ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { getUserByEmail, updatePassword } from "@/lib/queries/users";
import { adminPasswordUpdateSchema } from "@/lib/validators/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const guard = await requireAdminApi();
    if (!guard.ok) return guard.response;

    const body = await req.json();
    const parsed = adminPasswordUpdateSchema.parse(body);

    const fresh = await getUserByEmail(guard.user.email);
    if (!fresh) return fail("User not found", 404);

    const okPw = await verifyPassword(parsed.old_password, fresh.password);
    if (!okPw) {
      return fail("Current password is incorrect", 422, {
        errors: { old_password: ["Current password is incorrect"] },
      });
    }

    const hash = await hashPassword(parsed.password);
    await updatePassword({ userId: guard.user.id, passwordHash: hash });

    return ok({ message: "Password updated successfully." });
  } catch (err) {
    return handleError(err);
  }
}
