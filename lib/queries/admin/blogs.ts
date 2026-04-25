import "server-only";

import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { blogs } from "@/lib/db/schema";
import { buildListResult, type ListResult } from "@/lib/admin-pagination";

export interface AdminBlogRow {
  id: number;
  title: string | null;
  description: string | null;
  image: string | null;
  slug: string | null;
  published_date: Date | null;
  is_active: number;
  created_at: Date | null;
}

export async function listAdminBlogs(params: {
  page: number;
  perPage: number;
  keyword: string;
}): Promise<ListResult<AdminBlogRow>> {
  const { page, perPage, keyword } = params;
  const offset = (page - 1) * perPage;

  const whereParts = [];
  if (keyword) {
    const term = `%${keyword}%`;
    whereParts.push(
      or(like(blogs.title, term), like(blogs.description, term))!,
    );
  }
  const whereExpr = whereParts.length ? and(...whereParts) : undefined;

  const rows = await db
    .select({
      id: blogs.id,
      title: blogs.title,
      description: blogs.description,
      image: blogs.image,
      slug: blogs.slug,
      published_date: blogs.published_date,
      is_active: blogs.is_active,
      created_at: blogs.created_at,
    })
    .from(blogs)
    .where(whereExpr)
    .orderBy(desc(blogs.id))
    .limit(perPage)
    .offset(offset);

  const [{ count } = { count: 0 }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(blogs)
    .where(whereExpr);

  return buildListResult(rows, Number(count), page, perPage);
}

export async function getAdminBlogById(
  id: number,
): Promise<AdminBlogRow | null> {
  const rows = await db
    .select({
      id: blogs.id,
      title: blogs.title,
      description: blogs.description,
      image: blogs.image,
      slug: blogs.slug,
      published_date: blogs.published_date,
      is_active: blogs.is_active,
      created_at: blogs.created_at,
    })
    .from(blogs)
    .where(eq(blogs.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/* ============================================================
   WRITES
   ============================================================ */
export async function setAdminBlogActive(
  id: number,
  active: boolean,
): Promise<void> {
  await db
    .update(blogs)
    .set({ is_active: active ? 1 : 0, updated_at: sql`CURRENT_TIMESTAMP` })
    .where(eq(blogs.id, id));
}

export async function createAdminBlog(input: {
  title: string;
  description: string;
  slug: string;
  image: string;
  /** YYYY-MM-DD */
  published_date: string;
  is_active: number;
}): Promise<number> {
  const result = await db.insert(blogs).values({
    title: input.title,
    description: input.description,
    slug: input.slug,
    image: input.image,
    published_date: new Date(`${input.published_date}T00:00:00`),
    is_active: input.is_active,
    created_at: sql`CURRENT_TIMESTAMP`,
    updated_at: sql`CURRENT_TIMESTAMP`,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const insertId = (result as any)[0]?.insertId ?? (result as any).insertId;
  return Number(insertId);
}

export async function updateAdminBlog(
  id: number,
  input: {
    title: string;
    description: string;
    slug: string;
    image?: string;
    /** YYYY-MM-DD */
    published_date: string;
    is_active: number;
  },
): Promise<void> {
  const { image, published_date, ...rest } = input;
  await db
    .update(blogs)
    .set({
      ...rest,
      published_date: new Date(`${published_date}T00:00:00`),
      ...(image !== undefined ? { image } : {}),
      updated_at: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(blogs.id, id));
}

export async function deleteAdminBlog(
  id: number,
): Promise<{ image: string | null } | null> {
  const [row] = await db
    .select({ image: blogs.image })
    .from(blogs)
    .where(eq(blogs.id, id))
    .limit(1);
  if (!row) return null;
  await db.delete(blogs).where(eq(blogs.id, id));
  return row;
}

export async function ensureUniqueBlogSlug(base: string): Promise<string> {
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
  if (!slug) return "blog";

  let candidate = slug;
  let i = 1;
  for (;;) {
    const [existing] = await db
      .select({ id: blogs.id })
      .from(blogs)
      .where(eq(blogs.slug, candidate))
      .limit(1);
    if (!existing) return candidate;
    candidate = `${slug}-${i++}`;
  }
}
