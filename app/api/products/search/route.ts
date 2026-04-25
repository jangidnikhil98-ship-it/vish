import type { NextRequest } from "next/server";
import { searchProducts } from "@/lib/queries/products";
import { searchQuerySchema } from "@/lib/validators/products";
import { handleError, ok } from "@/lib/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/products/search?q=frame&limit=20
 * Used by the header search overlay.
 */
export async function GET(req: NextRequest) {
  try {
    const params = searchQuerySchema.parse({
      q: req.nextUrl.searchParams.get("q") ?? "",
      limit: req.nextUrl.searchParams.get("limit") ?? undefined,
    });
    const data = await searchProducts(params.q, params.limit);
    return ok(data, { cacheSeconds: 30, staleSeconds: 120 });
  } catch (err) {
    return handleError(err);
  }
}
