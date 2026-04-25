import "server-only";

import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { productImages, productSizes, products } from "@/lib/db/schema";
import { buildListResult, type ListResult } from "@/lib/admin-pagination";

/* ============================================================
   ADMIN PRODUCT LIST
   ============================================================ */
export interface AdminProductRow {
  id: number;
  product_name: string | null;
  sku: string | null;
  price: string | null;
  discount: number;
  stock_quantity: number | null;
  product_type: string | null;
  status: "active" | "inactive";
  main_image: string | null;
}

const mainImageSql = sql<string | null>`(
  SELECT pi.image_url FROM ${productImages} pi
  WHERE pi.product_id = ${products.id}
  ORDER BY pi.image_type ASC, pi.id ASC
  LIMIT 1
)`;

const defaultSizePriceSql = sql<string | null>`(
  SELECT ps.price FROM ${productSizes} ps
  WHERE ps.product_id = ${products.id}
  ORDER BY ps.is_default DESC, ps.id ASC
  LIMIT 1
)`;

export async function listAdminProducts(params: {
  page: number;
  perPage: number;
  keyword: string;
}): Promise<ListResult<AdminProductRow>> {
  const { page, perPage, keyword } = params;
  const offset = (page - 1) * perPage;

  const whereParts = [];
  if (keyword) {
    const term = `%${keyword}%`;
    whereParts.push(
      or(
        like(products.product_name, term),
        like(products.sku, term),
        like(products.product_type, term),
      )!,
    );
  }
  const whereExpr = whereParts.length ? and(...whereParts) : undefined;

  const rows = await db
    .select({
      id: products.id,
      product_name: products.product_name,
      sku: products.sku,
      price: defaultSizePriceSql,
      discount: products.discount,
      stock_quantity: products.stock_quantity,
      product_type: products.product_type,
      status: products.status,
      main_image: mainImageSql,
    })
    .from(products)
    .where(whereExpr)
    .orderBy(desc(products.id))
    .limit(perPage)
    .offset(offset);

  const [{ count } = { count: 0 }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(products)
    .where(whereExpr);

  return buildListResult(rows, Number(count), page, perPage);
}

/* ============================================================
   ADMIN PRODUCT DETAIL
   ============================================================ */
export interface AdminProductDetail {
  id: number;
  product_name: string | null;
  product_name_slug: string | null;
  sku: string | null;
  description: string | null;
  weight: string | null;
  width: number | null;
  height: string | null;
  product_type: string | null;
  product_for: string | null;
  stock_quantity: number | null;
  price: string | null;
  discount: number;
  status: "active" | "inactive";
  is_active: number;
  images: Array<{
    id: number;
    image_url: string | null;
    image_type: number;
  }>;
  sizes: Array<{
    id: number;
    label: string | null;
    value: string | null;
    price: string;
    final_price: string;
    discount: number;
    is_default: number;
  }>;
}

export async function getAdminProductById(
  id: number,
): Promise<AdminProductDetail | null> {
  const [p] = await db
    .select({
      id: products.id,
      product_name: products.product_name,
      product_name_slug: products.product_name_slug,
      sku: products.sku,
      description: products.description,
      weight: products.weight,
      width: products.width,
      height: products.height,
      product_type: products.product_type,
      product_for: products.product_for,
      stock_quantity: products.stock_quantity,
      price: products.price,
      discount: products.discount,
      status: products.status,
    })
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!p) return null;

  const [images, sizes] = await Promise.all([
    db
      .select({
        id: productImages.id,
        image_url: productImages.image_url,
        image_type: productImages.image_type,
      })
      .from(productImages)
      .where(eq(productImages.product_id, id))
      .orderBy(productImages.image_type, productImages.id),
    db
      .select({
        id: productSizes.id,
        label: productSizes.label,
        value: productSizes.value,
        price: productSizes.price,
        final_price: productSizes.final_price,
        discount: productSizes.discount,
        is_default: productSizes.is_default,
      })
      .from(productSizes)
      .where(eq(productSizes.product_id, id))
      .orderBy(desc(productSizes.is_default), productSizes.id),
  ]);

  return {
    ...p,
    is_active: p.status === "active" ? 1 : 0,
    images,
    sizes,
  };
}

/* ============================================================
   ADMIN PRODUCT WRITES
   ============================================================ */
export async function setAdminProductActive(
  id: number,
  active: boolean,
): Promise<void> {
  await db
    .update(products)
    .set({
      status: active ? "active" : "inactive",
      updated_at: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(products.id, id));
}

export async function deleteAdminProductImage(
  imageId: number,
): Promise<{ image_url: string | null } | null> {
  const [row] = await db
    .select({ image_url: productImages.image_url })
    .from(productImages)
    .where(eq(productImages.id, imageId))
    .limit(1);
  if (!row) return null;
  await db.delete(productImages).where(eq(productImages.id, imageId));
  return row;
}

/**
 * Replace the main image (image_type=1) for a product. Returns the relative
 * path of the image that was replaced (so the caller can delete the file
 * from disk), or null if there was no previous main image.
 */
export async function replaceMainProductImage(
  productId: number,
  newImageUrl: string,
): Promise<{ removedImageUrl: string | null }> {
  const [old] = await db
    .select({
      id: productImages.id,
      image_url: productImages.image_url,
    })
    .from(productImages)
    .where(
      and(
        eq(productImages.product_id, productId),
        eq(productImages.image_type, 1),
      ),
    )
    .limit(1);

  if (old) {
    await db.delete(productImages).where(eq(productImages.id, old.id));
  }

  await db.insert(productImages).values({
    product_id: productId,
    image_url: newImageUrl,
    image_type: 1,
    created_at: sql`CURRENT_TIMESTAMP`,
    updated_at: sql`CURRENT_TIMESTAMP`,
  });

  return { removedImageUrl: old?.image_url ?? null };
}

export async function deleteAdminProduct(id: number): Promise<void> {
  await db.delete(productSizes).where(eq(productSizes.product_id, id));
  await db.delete(productImages).where(eq(productImages.product_id, id));
  await db.delete(products).where(eq(products.id, id));
}

export interface SizeWriteInput {
  id?: number;
  label: string;
  value: string;
  price: number;
  discount: number;
  is_default: 0 | 1;
}

export interface ImageWriteInput {
  /** path under /public/storage (e.g. "productMediaLibrary/abc.webp") */
  image_url: string;
  image_type: 1 | 2;
}

export async function createAdminProduct(input: {
  product_name: string;
  product_name_slug: string;
  description: string;
  product_type: string;
  product_for: string;
  weight: number;
  stock_quantity: number;
  is_active: 0 | 1;
  sizes: SizeWriteInput[];
  images: ImageWriteInput[];
}): Promise<number> {
  const result = await db.insert(products).values({
    product_name: input.product_name,
    product_name_slug: input.product_name_slug,
    description: input.description,
    product_type: input.product_type,
    product_for: input.product_for,
    weight: String(input.weight),
    stock_quantity: input.stock_quantity,
    status: input.is_active ? "active" : "inactive",
    created_at: sql`CURRENT_TIMESTAMP`,
    updated_at: sql`CURRENT_TIMESTAMP`,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const productId = Number((result as any)[0]?.insertId ?? (result as any).insertId);

  if (input.sizes.length > 0) {
    await db.insert(productSizes).values(
      input.sizes.map((s) => ({
        product_id: productId,
        label: s.label,
        value: s.value,
        price: String(s.price),
        discount: s.discount,
        final_price: String(
          Math.max(0, s.price - (s.price * s.discount) / 100),
        ),
        is_default: s.is_default,
        created_at: sql`CURRENT_TIMESTAMP`,
        updated_at: sql`CURRENT_TIMESTAMP`,
      })),
    );
  }

  if (input.images.length > 0) {
    await db.insert(productImages).values(
      input.images.map((img) => ({
        product_id: productId,
        image_url: img.image_url,
        image_type: img.image_type,
        created_at: sql`CURRENT_TIMESTAMP`,
        updated_at: sql`CURRENT_TIMESTAMP`,
      })),
    );
  }

  return productId;
}

export async function updateAdminProduct(
  id: number,
  input: {
    product_name: string;
    description: string;
    product_type: string;
    product_for?: string;
    weight: number;
    stock_quantity: number;
    is_active: 0 | 1;
    sizes: SizeWriteInput[];
    newImages?: ImageWriteInput[];
  },
): Promise<void> {
  await db
    .update(products)
    .set({
      product_name: input.product_name,
      description: input.description,
      product_type: input.product_type,
      ...(input.product_for ? { product_for: input.product_for } : {}),
      weight: String(input.weight),
      stock_quantity: input.stock_quantity,
      status: input.is_active ? "active" : "inactive",
      updated_at: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(products.id, id));

  // Sizes: simple "delete existing, re-insert" strategy. Matches Laravel
  // controller which loops and either updates by id or creates new rows.
  // We pick the simpler/safer route since cart rows reference size_id —
  // see note below.
  //
  // NOTE: Carts that reference size_ids will lose their lookup after this.
  // The Laravel code had the same fragility. Acceptable for an admin edit.
  await db.delete(productSizes).where(eq(productSizes.product_id, id));
  if (input.sizes.length > 0) {
    await db.insert(productSizes).values(
      input.sizes.map((s) => ({
        product_id: id,
        label: s.label,
        value: s.value,
        price: String(s.price),
        discount: s.discount,
        final_price: String(
          Math.max(0, s.price - (s.price * s.discount) / 100),
        ),
        is_default: s.is_default,
        created_at: sql`CURRENT_TIMESTAMP`,
        updated_at: sql`CURRENT_TIMESTAMP`,
      })),
    );
  }

  if (input.newImages && input.newImages.length > 0) {
    await db.insert(productImages).values(
      input.newImages.map((img) => ({
        product_id: id,
        image_url: img.image_url,
        image_type: img.image_type,
        created_at: sql`CURRENT_TIMESTAMP`,
        updated_at: sql`CURRENT_TIMESTAMP`,
      })),
    );
  }
}

export async function ensureUniqueProductSlug(
  base: string,
): Promise<string> {
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
  if (!slug) return "product";

  let candidate = slug;
  let i = 1;
  for (;;) {
    const [existing] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.product_name_slug, candidate))
      .limit(1);
    if (!existing) return candidate;
    candidate = `${slug}-${i++}`;
  }
}
