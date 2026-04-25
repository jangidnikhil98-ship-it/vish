import "server-only";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { fail, handleError, ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import {
  getAdminProductById,
  setAdminProductActive,
} from "@/lib/queries/admin/products";

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
    if (!Number.isFinite(id)) return fail("Invalid product id", 400);

    const product = await getAdminProductById(id);
    if (!product) return fail("Product not found", 404);

    const { active } = statusSchema.parse(await req.json());
    await setAdminProductActive(id, active);

    return ok({ message: "Status updated successfully", active });
  } catch (err) {
    return handleError(err);
  }
}
