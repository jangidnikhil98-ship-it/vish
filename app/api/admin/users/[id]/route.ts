import "server-only";
import type { NextRequest } from "next/server";

import { fail, handleError, ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import {
  getAdminUserById,
  softDeleteAdminUser,
  updateAdminUserDetails,
} from "@/lib/queries/admin/users";
import { adminUserUpdateSchema } from "@/lib/validators/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const guard = await requireAdminApi();
    if (!guard.ok) return guard.response;

    const { id: idStr } = await ctx.params;
    const id = Number.parseInt(idStr, 10);
    if (!Number.isFinite(id)) return fail("Invalid user id", 400);

    const target = await getAdminUserById(id);
    if (!target) return fail("User not found", 404);

    const body = await req.json();
    const input = adminUserUpdateSchema.parse(body);

    await updateAdminUserDetails(id, {
      first_name: input.first_name,
      last_name: input.last_name,
      phone: input.phone,
      city: input.city || null,
      country_code: input.country_code || null,
    });

    return ok({ message: "Buyer profile has been updated successfully." });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const guard = await requireAdminApi();
    if (!guard.ok) return guard.response;

    const { id: idStr } = await ctx.params;
    const id = Number.parseInt(idStr, 10);
    if (!Number.isFinite(id)) return fail("Invalid user id", 400);

    const target = await getAdminUserById(id);
    if (!target) return fail("User not found", 404);

    if (target.role === "admin") {
      return fail("Refusing to delete an admin user.", 403);
    }

    await softDeleteAdminUser(id);
    return ok({ message: "User Deleted Successfully" });
  } catch (err) {
    return handleError(err);
  }
}
