import "server-only";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { fail, handleError, ok } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);
const MAX_BYTES = 1 * 1024 * 1024; // 1 MB after client-side compression

/**
 * POST /api/upload/product-image
 * Body: multipart/form-data with `image` field.
 * Returns: { path: "uploads/customer-images/<uuid>.jpg" } — relative to /public/storage
 *
 * Equivalent of Laravel `frontend.basket.productcastImage`.
 *
 * NOTE: This stores files on the local filesystem under `public/storage/uploads/customer-images/`.
 * That works on a single server / dev. For production on Vercel/serverless, swap this for S3,
 * Cloudflare R2, UploadThing, etc. — only the persistence step needs to change.
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("image");

    if (!(file instanceof Blob)) {
      return fail("No file uploaded", 400);
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return fail("Unsupported file type. Use JPG, PNG, or WebP.", 415);
    }
    if (file.size > MAX_BYTES) {
      return fail("File too large (max 1 MB after compression).", 413);
    }

    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpg";
    const filename = `${randomUUID()}.${ext}`;
    const relativeDir = "uploads/customer-images";
    const absoluteDir = path.join(process.cwd(), "public", "storage", relativeDir);
    await mkdir(absoluteDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(absoluteDir, filename), buffer);

    return ok({
      path: `${relativeDir}/${filename}`,
      url: `/storage/${relativeDir}/${filename}`,
    });
  } catch (err) {
    return handleError(err);
  }
}
