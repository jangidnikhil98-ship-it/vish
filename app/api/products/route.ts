import type { NextRequest } from "next/server";
import { listProducts } from "@/lib/queries/products";
import { productListQuerySchema } from "@/lib/validators/products";
import { handleError, ok } from "@/lib/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/products?type=birthday&page=1&perPage=16
 * Mirrors PageController@products.
 */
export async function GET(req: NextRequest) {
  try {
    const params = productListQuerySchema.parse({
      type: req.nextUrl.searchParams.get("type") ?? undefined,
      page: req.nextUrl.searchParams.get("page") ?? undefined,
      perPage: req.nextUrl.searchParams.get("perPage") ?? undefined,
    });
    const result = await listProducts(params);
    return ok(result, { cacheSeconds: 60, staleSeconds: 300 });
  } catch (err) {
    return handleError(err);
  }
}
