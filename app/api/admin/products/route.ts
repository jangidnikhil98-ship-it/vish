import "server-only";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { fail, handleError, ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import {
  createAdminProduct,
  ensureUniqueProductSlug,
  type ImageWriteInput,
  type SizeWriteInput,
} from "@/lib/queries/admin/products";
import { adminProductCreateSchema } from "@/lib/validators/admin";
import {
  saveStorageFile,
  validateProductImage,
} from "@/lib/admin-uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const guard = await requireAdminApi();
    if (!guard.ok) return guard.response;

    const form = await req.formData();
    const sizesJson = form.get("sizes");
    const sizes =
      typeof sizesJson === "string" && sizesJson ? JSON.parse(sizesJson) : [];

    const parsed = adminProductCreateSchema.parse({
      productName: form.get("productName") ?? "",
      description: form.get("description") ?? "",
      product_type: form.get("product_type") ?? "",
      product_for: form.get("product_for") ?? "round",
      weight: form.get("weight") ?? "0",
      stock_quantity: form.get("stock_quantity") ?? "0",
      is_active: form.get("is_active") ?? "1",
      default_size: form.get("default_size") ?? "0",
      sizes,
    });

    // Two separate fields: `main_image` (single) + `additional_images` (multi).
    // Backward compat: if only the old `images` field is sent, the first file
    // is treated as the main image and the rest as additionals.
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
      if (legacy.length > 0) {
        mainFile = legacy[0];
        additionalFiles = legacy.slice(1);
      }
    }

    if (!mainFile) {
      return fail("Please upload a main product image (.webp).", 422, {
        errors: { main_image: ["A main image is required"] },
      });
    }

    const allFiles = [mainFile, ...additionalFiles];
    for (const file of allFiles) {
      const v = validateProductImage(file);
      if (!v.ok) {
        return fail(v.message ?? "Invalid image", 422, {
          errors: { images: [v.message ?? "Invalid image"] },
        });
      }
    }

    const slug = await ensureUniqueProductSlug(parsed.productName);
    const sizeWrites: SizeWriteInput[] = parsed.sizes.map((s, i) => ({
      label: s.label,
      value: s.value,
      price: Number(s.price),
      discount: Number(s.discount ?? 0),
      is_default: i === parsed.default_size ? 1 : 0,
    }));

    if (sizeWrites.every((s) => s.is_default === 0)) sizeWrites[0].is_default = 1;

    // Persist files first so DB references are correct.
    const savedMain = await saveStorageFile(mainFile, "productMediaLibrary");
    const savedAdditional = await Promise.all(
      additionalFiles.map((f) => saveStorageFile(f, "productMediaLibrary")),
    );
    const images: ImageWriteInput[] = [
      { image_url: savedMain.relativePath, image_type: 1 },
      ...savedAdditional.map(
        (s) =>
          ({
            image_url: s.relativePath,
            image_type: 2,
          }) as ImageWriteInput,
      ),
    ];

    const id = await createAdminProduct({
      product_name: parsed.productName,
      product_name_slug: slug,
      description: parsed.description,
      product_type: parsed.product_type,
      product_for: parsed.product_for,
      weight: parsed.weight,
      stock_quantity: parsed.stock_quantity,
      is_active: (parsed.is_active === 1 ? 1 : 0) as 0 | 1,
      sizes: sizeWrites,
      images,
    });

    return ok({ id, message: "Product created successfully." });
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
