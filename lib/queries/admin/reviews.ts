import "server-only";
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { ratting, products } from "@/lib/db/schema";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";

export async function listAdminReviews(params: {
  page: number;
  perPage: number;
  keyword?: string;
}) {
  const { page, perPage, keyword } = params;
  const offset = (page - 1) * perPage;

  let whereExpr = undefined;
  if (keyword) {
    const term = `%${keyword}%`;
    whereExpr = or(
      like(ratting.first_name, term),
      like(ratting.last_name, term),
      like(ratting.comment, term)
    );
  }

  const baseRows = await db
    .select({
      id: ratting.id,
      firstName: ratting.first_name,
      lastName: ratting.last_name,
      rating: ratting.rating,
      comment: ratting.comment,
      image_url: ratting.image_url,
      created_at: ratting.created_at,
      productName: products.product_name,
    })
    .from(ratting)
    .leftJoin(products, eq(ratting.product_id, products.id))
    .where(whereExpr)
    .orderBy(desc(ratting.id))
    .limit(perPage)
    .offset(offset);

  const [{ count } = { count: 0 }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(ratting)
    .where(whereExpr);

  return {
    rows: baseRows,
    page,
    perPage,
    total: Number(count),
    totalPages: Math.max(1, Math.ceil(Number(count) / perPage)),
  };
}

export async function deleteReview(id: number) {
  await db.delete(ratting).where(eq(ratting.id, id));
  revalidateTag(CACHE_TAGS.products);
}

export async function getAdminReview(id: number) {
  const [row] = await db
    .select()
    .from(ratting)
    .where(eq(ratting.id, id))
    .limit(1);
  return row || null;
}
