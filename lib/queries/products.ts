import "server-only";
import { and, desc, eq, inArray, isNull, like, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  productImages,
  productSizes,
  products,
  ratting,
} from "@/lib/db/schema";
import { CACHE_TAGS, cached } from "@/lib/cache";
import type { ProductType } from "@/lib/validators/products";

/* ============================================================
   PUBLIC SHAPES (what API responses contain)
   ============================================================ */
export type ProductCard = {
  id: number;
  slug: string | null;
  name: string | null;
  image: string | null;
  price: number;
  finalPrice: number;
};

export type ProductDetail = ProductCard & {
  description: string | null;
  product_type: string | null;
  images: string[];
  sizes: Array<{
    id: number;
    label: string | null;
    price: number;
    finalPrice: number;
    discount: number;
    isDefault: boolean;
  }>;
  reviews: Array<{
    firstName: string | null;
    lastName: string | null;
    rating: number | null;
    comment: string | null;
  }>;
  reviewCount: number;
  avgRating: number;
};

export type ProductListResult = {
  data: ProductCard[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

/* ============================================================
   HELPERS
   ============================================================ */
const toNumber = (v: unknown): number => {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const defaultSizePriceSql = sql<string>`(
  SELECT ps.price FROM ${productSizes} ps
  WHERE ps.product_id = ${products.id}
  ORDER BY ps.is_default DESC, ps.id ASC
  LIMIT 1
)`;

const defaultSizeFinalPriceSql = sql<string>`(
  SELECT ps.final_price FROM ${productSizes} ps
  WHERE ps.product_id = ${products.id}
  ORDER BY ps.is_default DESC, ps.id ASC
  LIMIT 1
)`;

/**
 * Fetch the preview image url for a set of product ids in a single
 * batched query, then return a Map keyed by product id.
 *
 * Why we don't use a correlated subquery: with legacy / imported rows
 * (where many `product_images` entries default to `image_type = 1`)
 * the per-row subquery turned out to be unreliable in practice — the
 * admin product list ended up rendering the same picture for every
 * product. Doing the join in JS over the page's product ids is
 * deterministic, fast (one extra query per listing call), and matches
 * exactly what the Edit screen displays for each product.
 *
 * Sort order:
 *   image_type ASC → image_type = 1 (Main) wins when present
 *   id DESC        → freshly replaced rows win over stale duplicates
 * The first row per product id is the chosen preview.
 */
async function fetchPreviewImages(
  ids: ReadonlyArray<number>,
): Promise<Map<number, string>> {
  if (ids.length === 0) return new Map();
  const rows = await db
    .select({
      product_id: productImages.product_id,
      image_url: productImages.image_url,
    })
    .from(productImages)
    .where(inArray(productImages.product_id, ids as number[]))
    .orderBy(productImages.image_type, desc(productImages.id));

  const map = new Map<number, string>();
  for (const row of rows) {
    if (row.product_id == null || !row.image_url) continue;
    if (!map.has(row.product_id)) map.set(row.product_id, row.image_url);
  }
  return map;
}

// NOTE: Every public storefront query must add BOTH:
//   eq(products.status, "active")
//   isNull(products.deleted_at)        // Laravel soft-delete column
// otherwise rows that the admin "deleted" will still leak through.

/* ============================================================
   LIST PRODUCTS (cached 5 min)
   ============================================================ */
export const listProducts = cached(
  async (params: {
    type?: ProductType;
    page: number;
    perPage: number;
  }): Promise<ProductListResult> => {
    const { type, page, perPage } = params;
    const offset = (page - 1) * perPage;

    // Type filter — same intent as PageController@products
    const whereParts = [eq(products.status, "active"), isNull(products.deleted_at)];
    if (type) {
      if (type === "natural-wooden-slice") {
        whereParts.push(eq(products.product_for, "round"));
      } else if (type === "rectangle-wooden-frame") {
        whereParts.push(eq(products.product_for, "square"));
      } else if (type !== "bestseller") {
        whereParts.push(
          like(products.product_name, `%${type.replace(/-/g, " ")}%`),
        );
      }
    }
    const whereExpr = and(...whereParts);

    const baseRows = await db
      .select({
        id: products.id,
        slug: products.product_name_slug,
        name: products.product_name,
        price: defaultSizePriceSql,
        finalPrice: defaultSizeFinalPriceSql,
      })
      .from(products)
      .where(whereExpr)
      .orderBy(desc(products.id))
      .limit(Number(perPage))
      .offset(Number(offset));

    const [{ count } = { count: 0 }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(products)
      .where(whereExpr);

    const total = Number(count);

    const previews = await fetchPreviewImages(baseRows.map((r) => r.id));

    return {
      data: baseRows.map((r) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        image: previews.get(r.id) ?? null,
        price: toNumber(r.price),
        finalPrice: toNumber(r.finalPrice),
      })),
      page,
      perPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
    };
  },
  {
    keyParts: ["products:list"],
    tags: [CACHE_TAGS.products, CACHE_TAGS.productList],
    revalidate: 300,
  },
);

/* ============================================================
   GET PRODUCT DETAIL (cached forever, bust on admin edit)
   ============================================================ */
export const getProductBySlug = cached(
  async (slug: string): Promise<ProductDetail | null> => {
    const [product] = await db
      .select({
        id: products.id,
        slug: products.product_name_slug,
        name: products.product_name,
        description: products.description,
        product_type: products.product_type,
      })
      .from(products)
      .where(
        and(
          eq(products.product_name_slug, slug),
          eq(products.status, "active"),
          isNull(products.deleted_at),
        ),
      )
      .limit(1);

    if (!product) return null;

    const [images, sizes, reviewRows] = await Promise.all([
      db
        .select({
          url: productImages.image_url,
          imageType: productImages.image_type,
        })
        .from(productImages)
        .where(eq(productImages.product_id, product.id))
        .orderBy(productImages.image_type, productImages.id),
      db
        .select({
          id: productSizes.id,
          label: productSizes.label,
          price: productSizes.price,
          finalPrice: productSizes.final_price,
          discount: productSizes.discount,
          isDefault: productSizes.is_default,
        })
        .from(productSizes)
        .where(eq(productSizes.product_id, product.id))
        .orderBy(desc(productSizes.is_default), productSizes.id),
      db
        .select({
          firstName: ratting.first_name,
          lastName: ratting.last_name,
          rating: ratting.rating,
          comment: ratting.comment,
        })
        .from(ratting)
        // Match Laravel behaviour: rows with NULL product_id are global
        // testimonials shown on every product page, alongside any reviews
        // linked specifically to this product.
        .where(
          or(
            eq(ratting.product_id, product.id),
            isNull(ratting.product_id),
          ),
        )
        .orderBy(desc(ratting.id))
        .limit(20),
    ]);

    const defaultSize =
      sizes.find((s) => Number(s.isDefault) === 1) ?? sizes[0] ?? null;

    const reviewCount = reviewRows.length;
    const avgRating =
      reviewCount === 0
        ? 0
        : Math.round(
            (reviewRows.reduce((acc, r) => acc + (r.rating ?? 0), 0) /
              reviewCount) *
              10,
          ) / 10;

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      product_type: product.product_type,
      image: images[0]?.url ?? null,
      price: toNumber(defaultSize?.price),
      finalPrice: toNumber(defaultSize?.finalPrice),
      images: images
        .map((i) => i.url)
        .filter((u): u is string => typeof u === "string" && u.length > 0),
      sizes: sizes.map((s) => ({
        id: s.id,
        label: s.label,
        price: toNumber(s.price),
        finalPrice: toNumber(s.finalPrice),
        discount: toNumber(s.discount),
        isDefault: Number(s.isDefault) === 1,
      })),
      reviews: reviewRows,
      reviewCount,
      avgRating,
    };
  },
  {
    keyParts: ["products:bySlug"],
    tags: [CACHE_TAGS.products],
    // Revalidate every 60s so newly-added reviews show up within a minute,
    // even when the admin doesn't explicitly bust the cache.
    revalidate: 60,
  },
);

/* ============================================================
   GET RELATED PRODUCTS
   ============================================================ */
export const getRelatedProducts = cached(
  async (excludeId: number, limit: number = 4): Promise<ProductCard[]> => {
    const baseRows = await db
      .select({
        id: products.id,
        slug: products.product_name_slug,
        name: products.product_name,
        price: defaultSizePriceSql,
        finalPrice: defaultSizeFinalPriceSql,
      })
      .from(products)
      .where(
        and(
          eq(products.status, "active"),
          isNull(products.deleted_at),
          sql`${products.id} <> ${excludeId}`,
        ),
      )
      .orderBy(sql`RAND()`)
      .limit(Number(limit));

    const previews = await fetchPreviewImages(baseRows.map((r) => r.id));

    return baseRows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      image: previews.get(r.id) ?? null,
      price: toNumber(r.price),
      finalPrice: toNumber(r.finalPrice),
    }));
  },
  {
    keyParts: ["products:related"],
    tags: [CACHE_TAGS.products],
    revalidate: 600, // 10 min
  },
);

/* ============================================================
   SEARCH (cached 60s — search results don't need to be perfectly fresh)
   ============================================================ */
export const searchProducts = cached(
  async (q: string, limit: number = 20): Promise<ProductCard[]> => {
    const term = `%${q}%`;
    const baseRows = await db
      .select({
        id: products.id,
        slug: products.product_name_slug,
        name: products.product_name,
        price: defaultSizePriceSql,
        finalPrice: defaultSizeFinalPriceSql,
      })
      .from(products)
      .where(
        and(
          eq(products.status, "active"),
          isNull(products.deleted_at),
          or(
            like(products.product_name, term),
            like(products.description, term),
          ),
        ),
      )
      .orderBy(desc(products.id))
      .limit(Number(limit));

    const previews = await fetchPreviewImages(baseRows.map((r) => r.id));

    return baseRows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      image: previews.get(r.id) ?? null,
      price: toNumber(r.price),
      finalPrice: toNumber(r.finalPrice),
    }));
  },
  {
    keyParts: ["products:search"],
    tags: [CACHE_TAGS.products, CACHE_TAGS.productSearch],
    revalidate: 60,
  },
);

/* ============================================================
   BESTSELLERS (used on home page)
   ============================================================ */
export const getBestsellers = cached(
  async (limit: number = 8): Promise<ProductCard[]> => {
    const baseRows = await db
      .select({
        id: products.id,
        slug: products.product_name_slug,
        name: products.product_name,
        price: defaultSizePriceSql,
        finalPrice: defaultSizeFinalPriceSql,
      })
      .from(products)
      .where(and(eq(products.status, "active"), isNull(products.deleted_at)))
      .orderBy(desc(products.id))
      .limit(Number(limit));

    const previews = await fetchPreviewImages(baseRows.map((r) => r.id));

    return baseRows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      image: previews.get(r.id) ?? null,
      price: toNumber(r.price),
      finalPrice: toNumber(r.finalPrice),
    }));
  },
  {
    keyParts: ["products:bestsellers"],
    tags: [CACHE_TAGS.products],
    // Revalidate every 60s so admin product changes (new images, deletes,
    // status flips) show up on the home page within a minute.
    revalidate: 60,
  },
);
