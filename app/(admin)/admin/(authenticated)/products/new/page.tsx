import type { Metadata } from "next";

import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { FlashMessage } from "../../_components/FlashMessage";
import { ProductForm } from "../_components/ProductForm";

export const metadata: Metadata = { title: "Add Product | Admin" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ success?: string; error?: string }>;
}

export default async function AdminProductNewPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <>
      <AdminPageHeader
        title="Add Product"
        crumbs={[
          { label: "Products", href: "/admin/products" },
          { label: "Add Product" },
        ]}
      />
      <FlashMessage success={sp.success} error={sp.error} />

      <div className="container-fluid">
        <ProductForm
          mode="create"
          initial={{
            product_name: "",
            description: "",
            product_type: "",
            product_for: "round",
            weight: "0",
            stock_quantity: "0",
            is_active: 1,
            sizes: [
              { label: "Small", value: "5", price: "0", discount: "0" },
            ],
            default_size_index: 0,
          }}
        />
      </div>
    </>
  );
}
