import "server-only";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { fail, handleError, ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import {
  createAdminBlog,
  ensureUniqueBlogSlug,
} from "@/lib/queries/admin/blogs";
import { adminBlogCreateSchema } from "@/lib/validators/admin";
import { saveStorageFile, validateBlogImage } from "@/lib/admin-uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const guard = await requireAdminApi();
    if (!guard.ok) return guard.response;

    const form = await req.formData();
    const parsed = adminBlogCreateSchema.parse({
      title: form.get("title") ?? "",
      description: form.get("description") ?? "",
      published_at: form.get("published_at") ?? "",
      is_active: form.get("is_active") ?? "1",
    });

    const file = form.get("image");
    if (!(file instanceof Blob)) {
      return fail("Image is required", 422, {
        errors: { image: ["Image is required"] },
      });
    }
    const v = validateBlogImage(file);
    if (!v.ok) {
      return fail(v.message ?? "Invalid image", 422, {
        errors: { image: [v.message ?? "Invalid image"] },
      });
    }

    // Compute slug FIRST so the saved blog image filename mirrors it.
    const slug = await ensureUniqueBlogSlug(parsed.title);
    const saved = await saveStorageFile(file, "blogs", slug);

    const id = await createAdminBlog({
      title: parsed.title,
      description: parsed.description,
      slug,
      // The storefront expects to be able to render `<img src={asset(blog.image)}>`,
      // and Laravel stored e.g. "storage/blogs/abc.jpg". We mirror that shape.
      image: `storage/${saved.relativePath}`,
      published_date: parsed.published_at,
      is_active: parsed.is_active === 1 ? 1 : 0,
    });

    return ok({ id, message: "Blog created successfully." });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return fail("Validation failed", 422, {
        errors: err.flatten().fieldErrors,
      });
    }
    return handleError(err);
  }
}
