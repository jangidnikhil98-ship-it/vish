import "server-only";
import type { NextRequest } from "next/server";
import { fail, handleError, ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import { saveStorageFile } from "@/lib/admin-uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export async function POST(req: NextRequest) {
  try {
    const guard = await requireAdminApi();
    if (!guard.ok) return guard.response;

    const form = await req.formData();
    const file = form.get("image");

    if (!(file instanceof Blob)) {
      return fail("No image file uploaded", 400);
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return fail("Unsupported file type. Use JPG, PNG, or WebP.", 415);
    }
    if (file.size > MAX_BYTES) {
      return fail("File too large (max 2 MB).", 413);
    }

    const saved = await saveStorageFile(file, "categories", "category");

    return ok({
      path: saved.relativePath,
      url: saved.url,
    });
  } catch (err) {
    return handleError(err);
  }
}
