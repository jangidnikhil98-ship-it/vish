import "server-only";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { fail, handleError, ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import {
  getAdminUserById,
  setAdminUserActive,
} from "@/lib/queries/admin/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const statusSchema = z.object({ active: z.coerce.boolean() });

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const guard = await requireAdminApi();
    if (!guard.ok) return guard.response;

    const { id: idStr } = await ctx.params;
    const id = Number.parseInt(idStr, 10);
    if (!Number.isFinite(id)) return fail("Invalid user id", 400);

    const target = await getAdminUserById(id);
    if (!target) return fail("User not found", 404);
    if (target.role === "admin") {
      return fail("Refusing to deactivate an admin user.", 403);
    }

    const body = await req.json();
    const { active } = statusSchema.parse(body);
    await setAdminUserActive(id, active);

    return ok({ message: "Status updated successfully", active });
  } catch (err) {
    return handleError(err);
  }
}
