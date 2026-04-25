import type { Metadata } from "next";
import Link from "next/link";

import { listAdminProducts } from "@/lib/queries/admin/products";
import { readListParams } from "@/lib/admin-pagination";

import { AdminListShell } from "../_components/AdminListShell";
import { AdminPageHeader } from "../_components/AdminPageHeader";
import { AdminStatusToggle } from "../_components/AdminStatusToggle";
import { AdminDeleteButton } from "../_components/AdminDeleteButton";
import { FlashMessage } from "../_components/FlashMessage";

export const metadata: Metadata = { title: "Products | Admin" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    keyword?: string;
    page?: string;
    success?: string;
    error?: string;
  }>;
}

export default async function AdminProductsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { page, perPage, keyword } = readListParams(sp);

  const result = await listAdminProducts({ page, perPage, keyword });

  return (
    <>
      <AdminPageHeader title="Products" crumbs={[{ label: "Products" }]} />
      <FlashMessage success={sp.success} error={sp.error} />

      <AdminListShell
        basePath="/admin/products"
        searchPlaceholder="Search by name, SKU, type"
        keyword={keyword}
        page={result.page}
        totalPages={result.totalPages}
        createButton={{
          href: "/admin/products/new",
          label: "+ Add Product",
        }}
      >
        <table className="table userTable">
          <thead>
            <tr className="border-bottom-primary">
              <th>S.No</th>
              <th>Image</th>
              <th>Name</th>
              <th>Type</th>
              <th>Default Price (₹)</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.length === 0 ? (
              <tr className="border-bottom-secondary">
                <td colSpan={8} style={{ textAlign: "center" }}>
                  No Records Found
                </td>
              </tr>
            ) : (
              result.rows.map((p, i) => (
                <tr key={p.id} className="border-bottom-secondary">
                  <th scope="row">
                    {(result.page - 1) * result.perPage + i + 1}
                  </th>
                  <td>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        p.main_image
                          ? `/storage/${p.main_image}`
                          : "/img/no-image.png"
                      }
                      alt={p.product_name ?? ""}
                      style={{
                        width: 56,
                        height: 56,
                        objectFit: "cover",
                        borderRadius: 6,
                      }}
                    />
                  </td>
                  <td>
                    <strong>{p.product_name ?? "—"}</strong>
                    {p.sku ? (
                      <div className="small text-muted">{p.sku}</div>
                    ) : null}
                  </td>
                  <td>{p.product_type ?? "—"}</td>
                  <td>
                    ₹{" "}
                    {p.price
                      ? Number(p.price).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })
                      : "—"}
                  </td>
                  <td>{p.stock_quantity ?? 0}</td>
                  <td>
                    <AdminStatusToggle
                      endpoint={`/api/admin/products/${p.id}/status`}
                      active={p.status === "active"}
                    />
                  </td>
                  <td className="jsgrid-cell jsgrid-control-field jsgrid-align-center">
                    <Link
                      className="btn btn-pill btn-info btn-air-info btn-sm"
                      href={`/admin/products/${p.id}`}
                    >
                      View
                    </Link>
                    <Link
                      className="btn btn-pill btn-secondary btn-air-secondary btn-sm"
                      href={`/admin/products/${p.id}/edit`}
                    >
                      Edit
                    </Link>
                    <AdminDeleteButton
                      endpoint={`/api/admin/products/${p.id}`}
                      label="Delete"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </AdminListShell>
    </>
  );
}
