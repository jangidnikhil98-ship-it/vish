import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { products, blogs } from "@/lib/db/schema";
import { and, desc, eq, isNull } from "drizzle-orm";

export const revalidate = 3600;

const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "daily", priority: 1.0 },
  { path: "/products", changeFrequency: "daily", priority: 0.9 },
  { path: "/blogs", changeFrequency: "weekly", priority: 0.7 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/returns-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/shipping-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms-and-service", changeFrequency: "yearly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(
    ({ path, changeFrequency, priority }) => ({
      url: `${BASE_URL}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
    }),
  );

  let productEntries: MetadataRoute.Sitemap = [];
  let blogEntries: MetadataRoute.Sitemap = [];

  try {
    const productRows = await db
      .select({
        slug: products.product_name_slug,
        updated_at: products.updated_at,
      })
      .from(products)
      .where(and(eq(products.status, "active"), isNull(products.deleted_at)))
      .orderBy(desc(products.id))
      .limit(5000);

    productEntries = productRows
      .filter((r) => r.slug)
      .map((r) => ({
        url: `${BASE_URL}/products/${r.slug}`,
        lastModified: r.updated_at ?? now,
        changeFrequency: "weekly",
        priority: 0.8,
      }));
  } catch (err) {
    console.error("[sitemap] failed to load products:", err);
  }

  try {
    const blogRows = await db
      .select({
        slug: blogs.slug,
        updated_at: blogs.updated_at,
      })
      .from(blogs)
      .where(eq(blogs.is_active, 1))
      .orderBy(desc(blogs.id))
      .limit(5000);

    blogEntries = blogRows
      .filter((r) => r.slug)
      .map((r) => ({
        url: `${BASE_URL}/blogs/${r.slug}`,
        lastModified: r.updated_at ?? now,
        changeFrequency: "weekly",
        priority: 0.6,
      }));
  } catch (err) {
    console.error("[sitemap] failed to load blogs:", err);
  }

  return [...staticEntries, ...productEntries, ...blogEntries];
}
