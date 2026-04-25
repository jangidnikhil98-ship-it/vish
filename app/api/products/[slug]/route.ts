import type { NextRequest } from "next/server";
import {
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/queries/products";
import { fail, handleError, ok } from "@/lib/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/products/[slug]
 * Returns product detail + related products.
 * Mirrors PageController@productDetails.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    if (!slug) return fail("Slug required", 400);

    const product = await getProductBySlug(slug);
    if (!product) return fail("Product not found", 404);

    const relatedProducts = await getRelatedProducts(product.id, 4);

    return ok(
      {
        productDetails: product,
        relatedProducts,
        reviews: product.reviews,
        reviewCount: product.reviewCount,
        avgRating: product.avgRating,
      },
      { cacheSeconds: 300, staleSeconds: 3600 },
    );
  } catch (err) {
    return handleError(err);
  }
}
