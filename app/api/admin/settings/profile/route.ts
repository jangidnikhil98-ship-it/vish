import "server-only";
import type { NextRequest } from "next/server";

import { fail, handleError, ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import { updateOwnProfile } from "@/lib/queries/admin/users";
import { adminProfileUpdateSchema } from "@/lib/validators/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const guard = await requireAdminApi();
    if (!guard.ok) return guard.response;

    const body = await req.json();
    const parsed = adminProfileUpdateSchema.parse(body);

    await updateOwnProfile(guard.user.id, {
      first_name: parsed.first_name,
      last_name: parsed.last_name,
      company_name: (parsed.company_name ?? "").trim() || null,
    });

    return ok({ message: "Profile updated successfully." });
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Unexpected token")) {
      return fail("Invalid request body", 400);
    }
    return handleError(err);
  }
}
