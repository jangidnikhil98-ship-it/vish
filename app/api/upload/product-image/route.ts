import "server-only";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { fail, handleError, ok } from "@/lib/api";
import { readSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

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
 * File magic bytes for the formats we accept. We refuse anything whose
 * declared `Content-Type` doesn't match the actual bytes — clients trivially
 * lie about `file.type`, so we have to look at the file itself.
 */
function detectMime(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  // WebP: "RIFF" .... "WEBP"
  if (
    buffer.slice(0, 4).toString("ascii") === "RIFF" &&
    buffer.slice(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

/**
 * POST /api/upload/product-image
 * Body: multipart/form-data with `image` field.
 * Returns: { path: "uploads/customer-images/<uuid>.jpg" } — relative to /public/storage
 *
 * Used by the storefront product-customisation flow (Konva canvas → blob).
 *
 * Hardening:
 *   - Binds anonymous uploads to a guest_id cookie, creating one if the
 *     customer has not reached checkout yet.
 *   - Rate-limited per IP (10 uploads / 5 minutes).
 *   - Validates file magic bytes server-side, not the client-supplied
 *     Content-Type.
 *   - Filename comes from randomUUID() — never trust the client name.
 *
 * NOTE: This stores files on the local filesystem under
 * `public/storage/uploads/customer-images/`. Works on a single server / dev.
 * For Vercel/serverless, swap this for S3/R2/UploadThing — only the
 * persistence step needs to change.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await readSession();
    const existingGuestId = req.cookies.get("guest_id")?.value;
    const guestId = session ? existingGuestId : existingGuestId ?? randomUUID();

    const ipKey = ipFromRequest(req);
    const limited = rateLimit(`upload:${ipKey}`, { limit: 10, windowMs: 5 * 60_000 });
    if (!limited.ok) {
      return fail(`Too many uploads. Try again in ${limited.retryAfterSeconds}s.`, 429);
    }

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

    const buffer = Buffer.from(await file.arrayBuffer());
    const detected = detectMime(buffer);
    if (!detected || !ALLOWED_MIME.has(detected)) {
      return fail("File contents do not match an allowed image format.", 415);
    }

    const ext =
      detected === "image/png"
        ? "png"
        : detected === "image/webp"
          ? "webp"
          : "jpg";
    const filename = `${randomUUID()}.${ext}`;
    const relativeDir = "uploads/customer-images";
    const absoluteDir = path.join(process.cwd(), "public", "storage", relativeDir);
    await mkdir(absoluteDir, { recursive: true });

    await writeFile(path.join(absoluteDir, filename), buffer);

    const response = ok({
      path: `${relativeDir}/${filename}`,
      url: `/storage/${relativeDir}/${filename}`,
    });
    if (!session && !existingGuestId) {
      response.cookies.set("guest_id", guestId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    return response;
  } catch (err) {
    return handleError(err);
  }
}

function ipFromRequest(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
