import "server-only";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { fail, handleError, ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import {
  deleteAdminProduct,
  getAdminProductById,
  type ImageWriteInput,
  type SizeWriteInput,
  replaceMainProductImage,
  updateAdminProduct,
} from "@/lib/queries/admin/products";
import { adminProductCreateSchema } from "@/lib/validators/admin";
import {
  deleteStorageFile,
  saveStorageFile,
  validateProductImage,
} from "@/lib/admin-uploads";
import { CACHE_TAGS, bustCache } from "@/lib/cache";

/**
 * Storefront pages are aggressively cached (`unstable_cache`). We must
 * bust every product-related tag whenever an admin write happens so the
 * customer-facing listing & detail pages reflect new images / prices /
 * status flips immediately instead of after a 5-minute TTL.
 *
 * `getProductBySlug` only tags rows with the broad `products` tag, so
 * busting that one alone covers slug detail pages too. We still bust the
 * narrower tags explicitly to keep this future-proof if a query is ever
 * added that uses only the narrower tag.
 */
function bustProductCaches(slug?: string | null): void {
  bustCache(
    CACHE_TAGS.products,
    CACHE_TAGS.productList,
    CACHE_TAGS.productSearch,
  );
  if (slug) bustCache(CACHE_TAGS.product(slug));
}

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
    if (!Number.isFinite(id)) return fail("Invalid product id", 400);

    const product = await getAdminProductById(id);
    if (!product) return fail("Product not found", 404);

    const form = await req.formData();
    const sizesJson = form.get("sizes");
    const sizes =
      typeof sizesJson === "string" && sizesJson ? JSON.parse(sizesJson) : [];

    const parsed = adminProductCreateSchema.parse({
      productName: form.get("productName") ?? "",
      description: form.get("description") ?? "",
      product_type: form.get("product_type") ?? "",
      product_for: form.get("product_for") ?? product.product_for ?? "round",
      weight: form.get("weight") ?? "0",
      stock_quantity: form.get("stock_quantity") ?? "0",
      is_active: form.get("is_active") ?? "1",
      default_size: form.get("default_size") ?? "0",
      sizes,
    });

    // Same dual-field handling as the create endpoint.
    const mainRaw = form.get("main_image");
    let mainFile: File | null =
      mainRaw && typeof mainRaw !== "string" && mainRaw instanceof Blob
        ? (mainRaw as File)
        : null;

    const additionalRaw = form.getAll("additional_images");
    let additionalFiles: File[] = additionalRaw.filter(
      (f): f is File => typeof f !== "string" && f instanceof Blob,
    );

    if (!mainFile && additionalFiles.length === 0) {
      const legacyRaw = form.getAll("images");
      const legacy = legacyRaw.filter(
        (f): f is File => typeof f !== "string" && f instanceof Blob,
      );
      // For *edits*, legacy uploads are appended as additionals so we don't
      // accidentally clobber the existing main image.
      additionalFiles = legacy;
    }

    const allFiles = [...(mainFile ? [mainFile] : []), ...additionalFiles];
    for (const file of allFiles) {
      const v = validateProductImage(file);
      if (!v.ok) {
        return fail(v.message ?? "Invalid image", 422, {
          errors: { images: [v.message ?? "Invalid image"] },
        });
      }
    }

    const sizeWrites: SizeWriteInput[] = parsed.sizes.map((s, i) => ({
      label: s.label,
      value: s.value,
      price: Number(s.price),
      discount: Number(s.discount ?? 0),
      is_default: i === parsed.default_size ? 1 : 0,
    }));
    if (sizeWrites.every((s) => s.is_default === 0)) sizeWrites[0].is_default = 1;

    let newImages: ImageWriteInput[] | undefined;
    if (additionalFiles.length > 0) {
      const saved = await Promise.all(
        additionalFiles.map((f) => saveStorageFile(f, "productMediaLibrary")),
      );
      newImages = saved.map((s) => ({
        image_url: s.relativePath,
        image_type: 2,
      }));
    }

    await updateAdminProduct(id, {
      product_name: parsed.productName,
      description: parsed.description,
      product_type: parsed.product_type,
      weight: parsed.weight,
      stock_quantity: parsed.stock_quantity,
      is_active: (parsed.is_active === 1 ? 1 : 0) as 0 | 1,
      sizes: sizeWrites,
      newImages,
    });

    if (mainFile) {
      const savedMain = await saveStorageFile(mainFile, "productMediaLibrary");
      const { removedImageUrl } = await replaceMainProductImage(
        id,
        savedMain.relativePath,
      );
      if (removedImageUrl) {
        await deleteStorageFile(removedImageUrl);
      }
    }

    bustProductCaches(product.product_name_slug);

    return ok({ message: "Product updated successfully." });
  } catch (err) {
    if (err instanceof SyntaxError) {
      return fail("Sizes payload was not valid JSON", 422);
    }
    if (err instanceof z.ZodError) {
      return fail("Validation failed", 422, {
        errors: err.flatten().fieldErrors,
      });
    }
    return handleError(err);
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const guard = await requireAdminApi();
    if (!guard.ok) return guard.response;

    const { id: idStr } = await ctx.params;
    const id = Number.parseInt(idStr, 10);
    if (!Number.isFinite(id)) return fail("Invalid product id", 400);

    const product = await getAdminProductById(id);
    if (!product) return fail("Product not found", 404);

    await deleteAdminProduct(id);
    bustProductCaches(product.product_name_slug);
    return ok({ message: "Product deleted successfully." });
  } catch (err) {
    return handleError(err);
  }
}
