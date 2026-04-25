import type { NextRequest } from "next/server";
import { getBlogBySlug } from "@/lib/queries/blogs";
import { fail, handleError, ok } from "@/lib/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/blogs/[slug]
 * Mirrors PageController@innerBlog.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    if (!slug) return fail("Slug required", 400);
    const blog = await getBlogBySlug(slug);
    if (!blog) return fail("Blog not found", 404);
    return ok(blog, { cacheSeconds: 300, staleSeconds: 3600 });
  } catch (err) {
    return handleError(err);
  }
}
