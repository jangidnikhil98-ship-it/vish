"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface ProductSizeFormRow {
  id?: number;
  label: string;
  value: string;
  price: string;
  discount: string;
}

export interface ExistingImage {
  id: number;
  image_url: string;
  image_type: number;
}

export interface ProductFormProps {
  mode: "create" | "edit";
  productId?: number;
  initial: {
    product_name: string;
    description: string;
    product_type: string;
    product_for: "round" | "square";
    weight: string;
    stock_quantity: string;
    is_active: 0 | 1;
    sizes: ProductSizeFormRow[];
    default_size_index: number;
  };
  existingImages?: ExistingImage[];
}

const PRODUCT_TYPES = [
  "Birthday",
  "Anniversary",
  "Wedding",
  "Couple",
  "Family",
  "Other",
];

export function ProductForm({
  mode,
  productId,
  initial,
  existingImages = [],
}: ProductFormProps) {
  const router = useRouter();
  const [productName, setProductName] = useState(initial.product_name);
  const [description, setDescription] = useState(initial.description);
  const [productType, setProductType] = useState(initial.product_type);
  const [productFor, setProductFor] = useState<"round" | "square">(
    initial.product_for,
  );
  const [weight, setWeight] = useState(initial.weight);
  const [stockQty, setStockQty] = useState(initial.stock_quantity);
  const [isActive, setIsActive] = useState<0 | 1>(initial.is_active);
  const [sizes, setSizes] = useState<ProductSizeFormRow[]>(initial.sizes);
  const [defaultIdx, setDefaultIdx] = useState(initial.default_size_index);
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateSize = (
    i: number,
    key: keyof ProductSizeFormRow,
    value: string,
  ) =>
    setSizes((rows) =>
      rows.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)),
    );

  /**
   * Final price = price × (1 − discount/100).
   *
   * Returns `null` when the inputs aren't a valid pair of numbers (e.g.
   * the field is empty mid-edit) so the UI can render a dash instead of
   * NaN. Discount is clamped to [0, 100] so a stray "150" can't produce
   * a negative price in the preview while the user is still typing.
   */
  const computeFinalPrice = (
    priceRaw: string,
    discountRaw: string,
  ): number | null => {
    const price = Number(priceRaw);
    const discount = Number(discountRaw);
    if (!Number.isFinite(price)) return null;
    const d = Number.isFinite(discount)
      ? Math.min(100, Math.max(0, discount))
      : 0;
    return price - (price * d) / 100;
  };

  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  const addSizeRow = () =>
    setSizes((rows) => [
      ...rows,
      { label: "", value: "", price: "0", discount: "0" },
    ]);

  const removeSizeRow = (i: number) =>
    setSizes((rows) => rows.filter((_, idx) => idx !== i));

  const onMainFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setMainFile(file);
  };

  const onAdditionalFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files ? Array.from(e.target.files) : [];
    setAdditionalFiles(list);
  };

  async function deleteExisting(imageId: number) {
    if (!confirm("Delete this image?")) return;
    const res = await fetch(`/api/admin/products/images/${imageId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      alert(data.message ?? "Failed to delete image");
      return;
    }
    router.refresh();
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErrors({});
    setTopError(null);

    const fd = new FormData();
    fd.set("productName", productName);
    fd.set("description", description);
    fd.set("product_type", productType);
    fd.set("product_for", productFor);
    fd.set("weight", weight);
    fd.set("stock_quantity", stockQty);
    fd.set("is_active", String(isActive));
    fd.set("default_size", String(defaultIdx));
    fd.set("sizes", JSON.stringify(sizes));
    if (mainFile) fd.append("main_image", mainFile);
    additionalFiles.forEach((f) => fd.append("additional_images", f));

    try {
      const url =
        mode === "create"
          ? "/api/admin/products"
          : `/api/admin/products/${productId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, { method, body: fd });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.errors) {
          const flat: Record<string, string> = {};
          for (const [k, arr] of Object.entries(
            data.errors as Record<string, string[]>,
          )) {
            flat[k] = arr?.[0] ?? "Invalid value";
          }
          setErrors(flat);
        }
        setTopError(data.message ?? "Failed to save product");
        return;
      }

      const id = mode === "create" ? data.data.id : productId;
      router.push(
        `/admin/products/${id}/edit?success=${encodeURIComponent(
          mode === "create"
            ? "Product created successfully."
            : "Product updated successfully.",
        )}`,
      );
      router.refresh();
    } catch {
      setTopError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} encType="multipart/form-data" noValidate>
      {topError ? <div className="alert alert-danger">{topError}</div> : null}

      <div className="card">
        <div className="card-header pb-0">
          <h5>Basic Info</h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-8">
              <label className="form-label">Product Name</label>
              <input
                type="text"
                className={`form-control ${errors.productName ? "is-invalid" : ""}`}
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />
              {errors.productName ? (
                <div className="invalid-feedback">{errors.productName}</div>
              ) : null}
            </div>
            <div className="col-md-4">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={isActive}
                onChange={(e) =>
                  setIsActive(Number(e.target.value) as 0 | 1)
                }
              >
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label">Product Type</label>
              <select
                className={`form-select ${errors.product_type ? "is-invalid" : ""}`}
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                required
              >
                <option value="">Select type</option>
                {PRODUCT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {errors.product_type ? (
                <div className="invalid-feedback">{errors.product_type}</div>
              ) : null}
            </div>
            <div className="col-md-4">
              <label className="form-label">Shape</label>
              <select
                className="form-select"
                value={productFor}
                onChange={(e) =>
                  setProductFor(e.target.value as "round" | "square")
                }
                disabled={mode === "edit"}
              >
                <option value="round">Round</option>
                <option value="square">Square</option>
              </select>
              {mode === "edit" ? (
                <small className="text-muted">
                  Shape can&apos;t be changed after creation.
                </small>
              ) : null}
            </div>
            <div className="col-md-2">
              <label className="form-label">Weight (g)</label>
              <input
                type="number"
                step="0.01"
                className={`form-control ${errors.weight ? "is-invalid" : ""}`}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
              {errors.weight ? (
                <div className="invalid-feedback">{errors.weight}</div>
              ) : null}
            </div>
            <div className="col-md-2">
              <label className="form-label">Stock</label>
              <input
                type="number"
                className={`form-control ${errors.stock_quantity ? "is-invalid" : ""}`}
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
              />
              {errors.stock_quantity ? (
                <div className="invalid-feedback">{errors.stock_quantity}</div>
              ) : null}
            </div>

            <div className="col-12">
              <label className="form-label">Description</label>
              <textarea
                rows={5}
                className={`form-control ${errors.description ? "is-invalid" : ""}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              {errors.description ? (
                <div className="invalid-feedback">{errors.description}</div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-3">
        <div className="card-header pb-0 d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Sizes &amp; Pricing</h5>
          <button
            type="button"
            className="btn btn-pill btn-success btn-sm"
            onClick={addSizeRow}
          >
            + Add Size
          </button>
        </div>
        <div className="card-body">
          <div className="table-responsive custom-scrollbar">
            <table className="table">
              <thead>
                <tr className="border-bottom-primary">
                  <th>Default</th>
                  <th>Label</th>
                  <th>Value</th>
                  <th>Price (₹)</th>
                  <th>Discount %</th>
                  <th>Final Price (₹)</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sizes.map((s, i) => (
                  <tr key={i} className="border-bottom-secondary">
                    <td style={{ width: 80 }}>
                      <input
                        type="radio"
                        name="default_size"
                        checked={defaultIdx === i}
                        onChange={() => setDefaultIdx(i)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control"
                        value={s.label}
                        onChange={(e) =>
                          updateSize(i, "label", e.target.value)
                        }
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control"
                        value={s.value}
                        onChange={(e) =>
                          updateSize(i, "value", e.target.value)
                        }
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={s.price}
                        onChange={(e) =>
                          updateSize(i, "price", e.target.value)
                        }
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        max={100}
                        className="form-control"
                        value={s.discount}
                        onChange={(e) =>
                          updateSize(i, "discount", e.target.value)
                        }
                      />
                    </td>
                    <td style={{ minWidth: 130 }}>
                      {(() => {
                        const fp = computeFinalPrice(s.price, s.discount);
                        if (fp === null) {
                          return (
                            <span className="text-muted">—</span>
                          );
                        }
                        const hasDiscount =
                          Number(s.discount) > 0 && Number(s.price) > 0;
                        return (
                          <div className="d-flex align-items-center gap-2">
                            <span
                              className="fw-bold"
                              style={{ color: "#603813" }}
                            >
                              ₹{formatINR(fp)}
                            </span>
                            {hasDiscount ? (
                              <small
                                className="text-decoration-line-through text-muted"
                                title="Original price before discount"
                              >
                                ₹{formatINR(Number(s.price))}
                              </small>
                            ) : null}
                          </div>
                        );
                      })()}
                    </td>
                    <td>
                      {sizes.length > 1 ? (
                        <button
                          type="button"
                          className="btn btn-pill btn-danger btn-sm"
                          onClick={() => removeSizeRow(i)}
                        >
                          Remove
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card mt-3">
        <div className="card-header pb-0">
          <h5>Images</h5>
        </div>
        <div className="card-body">
          {existingImages.length > 0 ? (
            <div className="row g-3 mb-3">
              {existingImages.map((img) => (
                <div className="col-md-3" key={img.id}>
                  <div className="border rounded p-2 text-center position-relative">
                    {img.image_type === 1 ? (
                      <span
                        className="badge bg-primary position-absolute"
                        style={{ top: 8, left: 8 }}
                      >
                        Main
                      </span>
                    ) : (
                      <span
                        className="badge bg-secondary position-absolute"
                        style={{ top: 8, left: 8 }}
                      >
                        Additional
                      </span>
                    )}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/storage/${img.image_url}`}
                      alt=""
                      style={{
                        width: "100%",
                        height: 140,
                        objectFit: "cover",
                        borderRadius: 4,
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-pill btn-danger btn-sm mt-2"
                      onClick={() => deleteExisting(img.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">
                Main Image{" "}
                {mode === "create" ? (
                  <span className="text-danger">*</span>
                ) : (
                  <small className="text-muted">
                    (leave empty to keep current)
                  </small>
                )}
              </label>
              <input
                type="file"
                accept="image/webp"
                className={`form-control ${
                  errors.main_image ? "is-invalid" : ""
                }`}
                onChange={onMainFile}
              />
              <div className="form-text">
                One .webp file, max 512 KB. Shown first on the product page.
              </div>
              {mainFile ? (
                <div className="small text-success mt-1">
                  Selected: {mainFile.name}
                </div>
              ) : null}
              {errors.main_image ? (
                <div className="text-danger small mt-1">
                  {errors.main_image}
                </div>
              ) : null}
            </div>

            <div className="col-md-6">
              <label className="form-label">Additional Images</label>
              <input
                type="file"
                multiple
                accept="image/webp"
                className="form-control"
                onChange={onAdditionalFiles}
              />
              <div className="form-text">
                Multiple .webp files allowed (max 512 KB each). Shown in the
                product gallery after the main image.
              </div>
              {additionalFiles.length > 0 ? (
                <div className="small text-muted mt-1">
                  {additionalFiles.length} file
                  {additionalFiles.length === 1 ? "" : "s"} selected
                </div>
              ) : null}
              {errors.images ? (
                <div className="text-danger small mt-1">{errors.images}</div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex gap-2 mt-3">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy
            ? "Saving…"
            : mode === "create"
              ? "Create Product"
              : "Update Product"}
        </button>
      </div>
    </form>
  );
}
