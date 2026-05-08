"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface CouponFormProps {
  mode: "create" | "edit";
  couponId?: number;
  initial: {
    code: string;
    type: "percent" | "free_shipping";
    value: number;
    min_order_amount: number;
    max_discount_amount: number | null;
    usage_limit: number | null;
    description: string;
    valid_from: string; // YYYY-MM-DDTHH:mm or ""
    valid_until: string;
    is_active: 0 | 1;
  };
}

export function CouponForm({ mode, couponId, initial }: CouponFormProps) {
  const router = useRouter();
  const [code, setCode] = useState(initial.code);
  const [type, setType] = useState<"percent" | "free_shipping">(initial.type);
  const [value, setValue] = useState<string>(String(initial.value || ""));
  const [minOrder, setMinOrder] = useState<string>(
    String(initial.min_order_amount || ""),
  );
  const [maxDiscount, setMaxDiscount] = useState<string>(
    initial.max_discount_amount === null
      ? ""
      : String(initial.max_discount_amount),
  );
  const [usageLimit, setUsageLimit] = useState<string>(
    initial.usage_limit === null ? "" : String(initial.usage_limit),
  );
  const [description, setDescription] = useState(initial.description);
  const [validFrom, setValidFrom] = useState(initial.valid_from);
  const [validUntil, setValidUntil] = useState(initial.valid_until);
  const [isActive, setIsActive] = useState<0 | 1>(initial.is_active);

  const [topError, setTopError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setTopError(null);
    setErrors({});

    const body = {
      code: code.trim().toUpperCase(),
      type,
      value: type === "percent" ? Number(value) : 0,
      min_order_amount: Number(minOrder) || 0,
      max_discount_amount: maxDiscount === "" ? null : Number(maxDiscount),
      usage_limit: usageLimit === "" ? null : Number(usageLimit),
      description: description.trim(),
      valid_from: validFrom || "",
      valid_until: validUntil || "",
      is_active: isActive,
    };

    try {
      const url =
        mode === "create"
          ? "/api/admin/coupons"
          : `/api/admin/coupons/${couponId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
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
        setTopError(data.message ?? "Failed to save coupon");
        return;
      }
      const id = mode === "create" ? data.data.id : couponId;
      router.push(
        `/admin/coupons/${id}/edit?success=${encodeURIComponent(
          mode === "create"
            ? "Coupon created successfully."
            : "Coupon updated successfully.",
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
    <form onSubmit={onSubmit} noValidate>
      {topError ? <div className="alert alert-danger">{topError}</div> : null}

      <div className="card">
        <div className="card-body">
          <div className="row g-3">
            {/* ---- Code ---- */}
            <div className="col-md-4">
              <label className="form-label">Coupon Code</label>
              <input
                type="text"
                className={`form-control ${errors.code ? "is-invalid" : ""}`}
                value={code}
                onChange={(e) =>
                  setCode(
                    e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9_-]/g, "")
                      .slice(0, 32),
                  )
                }
                placeholder="DIWALI20"
                required
              />
              {errors.code ? (
                <div className="invalid-feedback">{errors.code}</div>
              ) : (
                <small className="text-muted">
                  2–32 chars. Letters, digits, underscore, hyphen.
                </small>
              )}
            </div>

            {/* ---- Type ---- */}
            <div className="col-md-3">
              <label className="form-label">Type</label>
              <select
                className="form-select"
                value={type}
                onChange={(e) =>
                  setType(e.target.value as "percent" | "free_shipping")
                }
              >
                <option value="percent">Percent off</option>
                <option value="free_shipping">Free shipping</option>
              </select>
            </div>

            {/* ---- Value (only when percent) ---- */}
            {type === "percent" ? (
              <div className="col-md-3">
                <label className="form-label">Discount %</label>
                <div className="input-group">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    step="0.01"
                    className={`form-control ${errors.value ? "is-invalid" : ""}`}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="10"
                    required
                  />
                  <span className="input-group-text">%</span>
                </div>
                {errors.value ? (
                  <div className="invalid-feedback d-block">
                    {errors.value}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="col-md-3" />
            )}

            {/* ---- Status ---- */}
            <div className="col-md-2">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={isActive}
                onChange={(e) => setIsActive(Number(e.target.value) as 0 | 1)}
              >
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>

            {/* ---- Description ---- */}
            <div className="col-12">
              <label className="form-label">Description (optional)</label>
              <input
                type="text"
                maxLength={255}
                className={`form-control ${errors.description ? "is-invalid" : ""}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Diwali sale 2026 — share this code on Instagram"
              />
              {errors.description ? (
                <div className="invalid-feedback">{errors.description}</div>
              ) : null}
            </div>

            {/* ---- Min order ---- */}
            <div className="col-md-3">
              <label className="form-label">Minimum Order Amount</label>
              <div className="input-group">
                <span className="input-group-text">₹</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className={`form-control ${errors.min_order_amount ? "is-invalid" : ""}`}
                  value={minOrder}
                  onChange={(e) => setMinOrder(e.target.value)}
                  placeholder="0"
                />
              </div>
              {errors.min_order_amount ? (
                <div className="invalid-feedback d-block">
                  {errors.min_order_amount}
                </div>
              ) : (
                <small className="text-muted">0 = no minimum.</small>
              )}
            </div>

            {/* ---- Max discount cap (percent only) ---- */}
            {type === "percent" ? (
              <div className="col-md-3">
                <label className="form-label">Maximum Discount</label>
                <div className="input-group">
                  <span className="input-group-text">₹</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className={`form-control ${errors.max_discount_amount ? "is-invalid" : ""}`}
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    placeholder="No cap"
                  />
                </div>
                {errors.max_discount_amount ? (
                  <div className="invalid-feedback d-block">
                    {errors.max_discount_amount}
                  </div>
                ) : (
                  <small className="text-muted">
                    Leave blank for no cap.
                  </small>
                )}
              </div>
            ) : (
              <div className="col-md-3" />
            )}

            {/* ---- Usage limit ---- */}
            <div className="col-md-3">
              <label className="form-label">Total Uses</label>
              <input
                type="number"
                min={1}
                step={1}
                className={`form-control ${errors.usage_limit ? "is-invalid" : ""}`}
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                placeholder="Unlimited"
              />
              {errors.usage_limit ? (
                <div className="invalid-feedback">{errors.usage_limit}</div>
              ) : (
                <small className="text-muted">Blank = unlimited.</small>
              )}
            </div>

            {/* ---- Validity window ---- */}
            <div className="col-md-3">
              <label className="form-label">Valid From (optional)</label>
              <input
                type="datetime-local"
                className={`form-control ${errors.valid_from ? "is-invalid" : ""}`}
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
              />
              {errors.valid_from ? (
                <div className="invalid-feedback">{errors.valid_from}</div>
              ) : null}
            </div>

            <div className="col-md-3">
              <label className="form-label">Valid Until (optional)</label>
              <input
                type="datetime-local"
                className={`form-control ${errors.valid_until ? "is-invalid" : ""}`}
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
              {errors.valid_until ? (
                <div className="invalid-feedback">{errors.valid_until}</div>
              ) : null}
            </div>

            <div className="col-12 d-flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy
                  ? "Saving…"
                  : mode === "create"
                    ? "Create Coupon"
                    : "Update Coupon"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
