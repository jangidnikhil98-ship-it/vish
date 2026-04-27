import "server-only";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { fail, handleError, ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import {
  deleteAdminBlog,
  ensureUniqueBlogSlug,
  getAdminBlogById,
  updateAdminBlog,
} from "@/lib/queries/admin/blogs";
import { adminBlogCreateSchema } from "@/lib/validators/admin";
import {
  deleteStorageFile,
  saveStorageFile,
  validateBlogImage,
} from "@/lib/admin-uploads";

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
    if (!Number.isFinite(id)) return fail("Invalid blog id", 400);

    const blog = await getAdminBlogById(id);
    if (!blog) return fail("Blog not found", 404);

    const form = await req.formData();
    const parsed = adminBlogCreateSchema.parse({
      title: form.get("title") ?? "",
      description: form.get("description") ?? "",
      published_at: form.get("published_at") ?? "",
      is_active: form.get("is_active") ?? "1",
    });

    // Resolve slug FIRST so we can use it as the SEO-friendly filename
    // prefix when re-uploading the cover image.
    const slug =
      parsed.title === blog.title
        ? blog.slug ?? (await ensureUniqueBlogSlug(parsed.title))
        : await ensureUniqueBlogSlug(parsed.title);

    let imagePath: string | undefined;
    const file = form.get("image");
    if (file instanceof Blob && file.size > 0) {
      const v = validateBlogImage(file);
      if (!v.ok) {
        return fail(v.message ?? "Invalid image", 422, {
          errors: { image: [v.message ?? "Invalid image"] },
        });
      }
      const saved = await saveStorageFile(file, "blogs", slug);
      imagePath = `storage/${saved.relativePath}`;
      // Drop the previous file from disk if it still lives under /public/storage.
      if (blog.image && blog.image.startsWith("storage/")) {
        await deleteStorageFile(blog.image.replace(/^storage\//, ""));
      }
    }

    await updateAdminBlog(id, {
      title: parsed.title,
      description: parsed.description,
      slug: slug ?? "",
      ...(imagePath !== undefined ? { image: imagePath } : {}),
      published_date: parsed.published_at,
      is_active: parsed.is_active === 1 ? 1 : 0,
    });

    return ok({ message: "Blog updated successfully." });
  } catch (err) {
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
    if (!Number.isFinite(id)) return fail("Invalid blog id", 400);

    const removed = await deleteAdminBlog(id);
    if (!removed) return fail("Blog not found", 404);

    if (removed.image && removed.image.startsWith("storage/")) {
      await deleteStorageFile(removed.image.replace(/^storage\//, ""));
    }
    return ok({ message: "Blog deleted successfully." });
  } catch (err) {
    return handleError(err);
  }
}
