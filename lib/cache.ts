import "server-only";
import { unstable_cache, revalidateTag } from "next/cache";

/**
 * Cache tags used across the app. Centralised so we can revalidate
 * the right slices when data changes (e.g. after admin edit).
 */
export const CACHE_TAGS = {
  products: "products",
  product: (slug: string) => `product:${slug}`,
  productSearch: "product-search",
  productList: "product-list",
  blogs: "blogs",
  blog: (slug: string) => `blog:${slug}`,
} as const;

/**
 * Wrap any async DB query with route + tag-based caching.
 * Defaults to 5 min revalidation; pass `revalidate: false` to cache forever
 * (useful for product detail — invalidate explicitly with `revalidateTag`).
 */
export function cached<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  opts: {
    keyParts: string[];
    tags: string[];
    revalidate?: number | false;
  },
): (...args: TArgs) => Promise<TResult> {
  return unstable_cache(fn, opts.keyParts, {
    tags: opts.tags,
    revalidate: opts.revalidate === false ? false : opts.revalidate ?? 300,
  });
}

/**
 * Revalidate one or more cache tags. Call after writes
 * (e.g. when admin edits a product, do `bustCache(CACHE_TAGS.products)`).
 */
export function bustCache(...tags: string[]): void {
  for (const t of tags) revalidateTag(t, "max");
}
