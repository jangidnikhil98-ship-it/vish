import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getAdminProductById } from "@/lib/queries/admin/products";
import { AdminPageHeader } from "../../_components/AdminPageHeader";

export const metadata: Metadata = { title: "Product Details | Admin" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminProductViewPage({ params }: Props) {
  const { id: idStr } = await params;
  const id = Number.parseInt(idStr, 10);
  if (!Number.isFinite(id)) notFound();

  const product = await getAdminProductById(id);
  if (!product) notFound();

  return (
    <>
      <AdminPageHeader
        title="Product Details"
        crumbs={[
          { label: "Products", href: "/admin/products" },
          { label: product.product_name ?? "Product" },
        ]}
      />

      <div className="container-fluid">
        <div className="row">
          <div className="col-md-5">
            <div className="card">
              <div className="card-body">
                <div className="row g-3">
                  {product.images.length === 0 ? (
                    <div className="col-12 text-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/img/no-image.png"
                        alt={product.product_name ?? ""}
                        style={{ maxWidth: "100%" }}
                      />
                    </div>
                  ) : (
                    product.images.map((img) => (
                      <div className="col-6" key={img.id}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            img.image_url
                              ? `/storage/${img.image_url}`
                              : "/img/no-image.png"
                          }
                          alt={product.product_name ?? ""}
                          style={{
                            width: "100%",
                            height: 160,
                            objectFit: "cover",
                            borderRadius: 6,
                            border:
                              img.image_type === 1
                                ? "2px solid #613a18"
                                : "1px solid #ddd",
                          }}
                        />
                        {img.image_type === 1 ? (
                          <div className="small text-muted text-center mt-1">
                            Main image
                          </div>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-7">
            <div className="card">
              <div className="card-header pb-0 d-flex justify-content-between align-items-center">
                <h4 className="mb-0">{product.product_name}</h4>
                <Link
                  href={`/admin/products/${product.id}/edit`}
                  className="btn btn-pill btn-secondary btn-sm"
                >
                  Edit
                </Link>
              </div>
              <div className="card-body">
                <div className="table-responsive custom-scrollbar">
                  <table className="table">
                    <tbody>
                      <tr className="border-bottom-secondary">
                        <td>
                          <strong>SKU</strong>
                        </td>
                        <td>{product.sku ?? "—"}</td>
                      </tr>
                      <tr className="border-bottom-secondary">
                        <td>
                          <strong>Type</strong>
                        </td>
                        <td>{product.product_type ?? "—"}</td>
                      </tr>
                      <tr className="border-bottom-secondary">
                        <td>
                          <strong>Shape</strong>
                        </td>
                        <td>{product.product_for ?? "—"}</td>
                      </tr>
                      <tr className="border-bottom-secondary">
                        <td>
                          <strong>Stock</strong>
                        </td>
                        <td>{product.stock_quantity ?? 0}</td>
                      </tr>
                      <tr className="border-bottom-secondary">
                        <td>
                          <strong>Status</strong>
                        </td>
                        <td>
                          <span
                            className={
                              "badge rounded-pill p-2 " +
                              (product.status === "active"
                                ? "badge-success"
                                : "badge-danger")
                            }
                          >
                            {product.status}
                          </span>
                        </td>
                      </tr>
                      <tr className="border-bottom-secondary">
                        <td>
                          <strong>Description</strong>
                        </td>
                        <td>
                          <div
                            dangerouslySetInnerHTML={{
                              __html: product.description ?? "",
                            }}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header pb-0">
                <h5>Sizes &amp; Pricing</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive custom-scrollbar">
                  <table className="table">
                    <thead>
                      <tr className="border-bottom-primary">
                        <th>Label</th>
                        <th>Value</th>
                        <th>Price (₹)</th>
                        <th>Discount %</th>
                        <th>Final Price (₹)</th>
                        <th>Default</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.sizes.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="text-muted"
                            style={{ textAlign: "center" }}
                          >
                            No sizes configured.
                          </td>
                        </tr>
                      ) : (
                        product.sizes.map((s) => (
                          <tr key={s.id} className="border-bottom-secondary">
                            <td>{s.label}</td>
                            <td>{s.value}</td>
                            <td>{Number(s.price).toFixed(2)}</td>
                            <td>{s.discount}</td>
                            <td>{Number(s.final_price).toFixed(2)}</td>
                            <td>
                              {s.is_default === 1 ? (
                                <span className="badge rounded-pill badge-success p-2">
                                  Default
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
