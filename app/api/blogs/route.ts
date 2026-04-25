import type { NextRequest } from "next/server";
import { z } from "zod";
import { listBlogs } from "@/lib/queries/blogs";
import { handleError, ok } from "@/lib/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(10),
});

/**
 * GET /api/blogs?page=1&perPage=10
 * Mirrors PageController@blogsPage.
 */
export async function GET(req: NextRequest) {
  try {
    const params = querySchema.parse({
      page: req.nextUrl.searchParams.get("page") ?? undefined,
      perPage: req.nextUrl.searchParams.get("perPage") ?? undefined,
    });
    const result = await listBlogs(params.page, params.perPage);
    return ok(result, { cacheSeconds: 120, staleSeconds: 600 });
  } catch (err) {
    return handleError(err);
  }
}
