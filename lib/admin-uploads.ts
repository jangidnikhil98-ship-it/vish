import "server-only";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

const PUBLIC_ROOT = path.join(process.cwd(), "public");
const STORAGE_ROOT = path.join(PUBLIC_ROOT, "storage");

const PRODUCT_IMAGE_MIME = new Set(["image/webp"]);
const BLOG_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/svg+xml",
  "image/webp",
]);

const PRODUCT_IMAGE_MAX = 512 * 1024; // 512 KB — same as Laravel mimes:webp|max:512
const BLOG_IMAGE_MAX = 2 * 1024 * 1024; // 2 MB — same as Laravel image|mimes:..|max:2048

export interface SavedFile {
  /** path relative to /public/storage (e.g. "productMediaLibrary/abc.webp") */
  relativePath: string;
  /** absolute filesystem path */
  absolutePath: string;
  /** the URL to serve it from */
  url: string;
}

/**
 * Save a single file under `/public/storage/<subdir>/<uuid>.<ext>`.
 * Caller is responsible for validating the file beforehand (mime/size).
 *
 * Why a uuid? We never trust user-provided filenames — they leak host info
 * and can collide. uuid + extension is enough for cache-busting.
 */
export async function saveStorageFile(
  file: Blob,
  subdir: string,
): Promise<SavedFile> {
  const safeSubdir = subdir.replace(/[^a-zA-Z0-9_\-/]/g, "");
  const targetDir = path.join(STORAGE_ROOT, safeSubdir);
  await mkdir(targetDir, { recursive: true });

  const ext = pickExtension(file.type);
  const filename = `${Date.now()}_${randomUUID().slice(0, 8)}.${ext}`;
  const absolutePath = path.join(targetDir, filename);
  const relativePath = `${safeSubdir}/${filename}`.replace(/\\/g, "/");

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);

  return {
    relativePath,
    absolutePath,
    url: `/storage/${relativePath}`,
  };
}

/**
 * Best-effort delete of a file previously saved via `saveStorageFile`.
 * Accepts either the relative path ("productMediaLibrary/abc.webp") or the
 * legacy Laravel-shaped path stored in DB ("productMediaLibrary/abc.webp").
 */
export async function deleteStorageFile(
  relativePath: string | null | undefined,
): Promise<void> {
  if (!relativePath) return;
  // Refuse anything with .. so we never escape /public/storage.
  if (relativePath.includes("..")) return;
  const abs = path.join(STORAGE_ROOT, relativePath);
  try {
    await unlink(abs);
  } catch {
    // file might already be gone — that's fine.
  }
}

/* ============================================================
   Validation helpers used by route handlers
   ============================================================ */
export function validateProductImage(file: Blob | null | undefined): {
  ok: boolean;
  message?: string;
} {
  if (!file) return { ok: false, message: "No image uploaded" };
  if (!PRODUCT_IMAGE_MIME.has(file.type)) {
    return { ok: false, message: "Only .webp images are allowed" };
  }
  if (file.size > PRODUCT_IMAGE_MAX) {
    return { ok: false, message: "Image must be 512 KB or smaller" };
  }
  return { ok: true };
}

export function validateBlogImage(file: Blob | null | undefined): {
  ok: boolean;
  message?: string;
} {
  if (!file) return { ok: false, message: "No image uploaded" };
  if (!BLOG_IMAGE_MIME.has(file.type)) {
    return { ok: false, message: "Unsupported image type" };
  }
  if (file.size > BLOG_IMAGE_MAX) {
    return { ok: false, message: "Image must be 2 MB or smaller" };
  }
  return { ok: true };
}

/* ============================================================ */
function pickExtension(mime: string): string {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/svg+xml":
      return "svg";
    case "image/jpeg":
    case "image/jpg":
    default:
      return "jpg";
  }
}
