import type { NextRequest } from "next/server";
import { z } from "zod";
import { fail, handleError, ok } from "@/lib/api";
import { readSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { getUserById } from "@/lib/queries/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateProfileSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(100),
  last_name: z.string().trim().max(100).optional().default(""),
  phone: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Phone must be exactly 10 digits")
    .nullable()
    .optional(),
});

/**
 * PATCH /api/auth/profile
 * Update the current user's first_name, last_name and phone.
 * Email is intentionally NOT editable here (it's the login identifier).
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await readSession();
    if (!session) return fail("Not authenticated", 401);

    const json = await req.json().catch(() => null);
    const parsed = updateProfileSchema.safeParse(json);
    if (!parsed.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path.join(".") || "_";
        (errors[path] ??= []).push(issue.message);
      }
      return fail("Validation failed", 422, { errors });
    }

    const { first_name, last_name, phone } = parsed.data;

    await db
      .update(users)
      .set({
        first_name,
        last_name: last_name ?? "",
        phone: phone ?? null,
        updated_at: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(users.id, session.sub));

    const updated = await getUserById(session.sub);
    if (!updated) return fail("User no longer exists", 404);

    return ok({
      id: updated.id,
      first_name: updated.first_name,
      last_name: updated.last_name,
      email: updated.email,
      phone: updated.phone,
    });
  } catch (err) {
    return handleError(err);
  }
}
