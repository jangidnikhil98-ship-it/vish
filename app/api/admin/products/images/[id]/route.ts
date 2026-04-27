import "server-only";
import type { NextRequest } from "next/server";

import { fail, handleError, ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import { deleteAdminProductImage } from "@/lib/queries/admin/products";
import { deleteStorageFile } from "@/lib/admin-uploads";
import { CACHE_TAGS, bustCache } from "@/lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const guard = await requireAdminApi();
    if (!guard.ok) return guard.response;

    const { id: idStr } = await ctx.params;
    const imageId = Number.parseInt(idStr, 10);
    if (!Number.isFinite(imageId)) return fail("Invalid image id", 400);

    const removed = await deleteAdminProductImage(imageId);
    if (!removed) return fail("Image not found", 404);

    await deleteStorageFile(removed.image_url);

    // Deleting an image (especially the main one) must invalidate every
    // storefront cache that might still be pointing at the now-deleted
    // file path.
    bustCache(
      CACHE_TAGS.products,
      CACHE_TAGS.productList,
      CACHE_TAGS.productSearch,
    );

    return ok({ message: "Image deleted successfully." });
  } catch (err) {
    return handleError(err);
  }
}
