import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { blogs } from "@/lib/db/schema";
import { CACHE_TAGS, cached } from "@/lib/cache";

export type BlogCard = {
  id: number;
  slug: string | null;
  title: string | null;
  image: string | null;
  description: string | null;
  publishedDate: Date | null;
  createdAt: Date | null;
};

export type BlogDetail = BlogCard;

export type BlogListResult = {
  data: BlogCard[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

const isActiveExpr = eq(blogs.is_active, 1);

export const listBlogs = cached(
  async (page: number, perPage: number): Promise<BlogListResult> => {
    const offset = (page - 1) * perPage;

    const [rows, [{ count } = { count: 0 }]] = await Promise.all([
      db
        .select({
          id: blogs.id,
          slug: blogs.slug,
          title: blogs.title,
          image: blogs.image,
          description: blogs.description,
          publishedDate: blogs.published_date,
          createdAt: blogs.created_at,
        })
        .from(blogs)
        .where(isActiveExpr)
        .orderBy(desc(blogs.id))
        .limit(Number(perPage))
        .offset(Number(offset)),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(blogs)
        .where(isActiveExpr),
    ]);

    const total = Number(count);
    return {
      data: rows,
      page,
      perPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
    };
  },
  {
    keyParts: ["blogs:list"],
    tags: [CACHE_TAGS.blogs],
    revalidate: 300,
  },
);

export const getBlogBySlug = cached(
  async (slug: string): Promise<BlogDetail | null> => {
    const [row] = await db
      .select({
        id: blogs.id,
        slug: blogs.slug,
        title: blogs.title,
        image: blogs.image,
        description: blogs.description,
        publishedDate: blogs.published_date,
        createdAt: blogs.created_at,
      })
      .from(blogs)
      .where(and(eq(blogs.slug, slug), isActiveExpr))
      .limit(1);

    return row ?? null;
  },
  {
    keyParts: ["blogs:bySlug"],
    tags: [CACHE_TAGS.blogs],
    revalidate: false,
  },
);
