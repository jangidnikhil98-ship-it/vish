import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAdminProductById } from "@/lib/queries/admin/products";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { FlashMessage } from "../../../_components/FlashMessage";
import { ProductForm } from "../../_components/ProductForm";

export const metadata: Metadata = { title: "Edit Product | Admin" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}

export default async function AdminProductEditPage({
  params,
  searchParams,
}: Props) {
  const [{ id: idStr }, sp] = await Promise.all([params, searchParams]);
  const id = Number.parseInt(idStr, 10);
  if (!Number.isFinite(id)) notFound();

  const product = await getAdminProductById(id);
  if (!product) notFound();

  const defaultIdx = Math.max(
    0,
    product.sizes.findIndex((s) => s.is_default === 1),
  );

  return (
    <>
      <AdminPageHeader
        title="Edit Product"
        crumbs={[
          { label: "Products", href: "/admin/products" },
          { label: product.product_name ?? "Edit Product" },
        ]}
      />
      <FlashMessage success={sp.success} error={sp.error} />

      <div className="container-fluid">
        <ProductForm
          mode="edit"
          productId={product.id}
          initial={{
            product_name: product.product_name ?? "",
            description: product.description ?? "",
            product_type: product.product_type ?? "",
            product_for:
              product.product_for === "square" ? "square" : "round",
            weight: product.weight ?? "0",
            stock_quantity: String(product.stock_quantity ?? 0),
            is_active: product.is_active === 1 ? 1 : 0,
            sizes: product.sizes.map((s) => ({
              id: s.id,
              label: s.label ?? "",
              value: s.value ?? "",
              price: String(s.price),
              discount: String(s.discount),
            })),
            default_size_index: defaultIdx,
          }}
          existingImages={product.images.map((img) => ({
            id: img.id,
            image_url: img.image_url ?? "",
            image_type: img.image_type,
          }))}
        />
      </div>
    </>
  );
}
