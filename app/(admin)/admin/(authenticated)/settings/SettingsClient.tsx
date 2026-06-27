"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Profile {
  first_name: string;
  last_name: string;
  email: string;
  company_name: string;
}

interface StoreSettings {
  cod_enabled: string;
  cod_fee: string;
  cod_min_order_amount: string;
  cod_max_order_amount: string;
  default_shipping_fee: string;
  shiprocket_pickup_location: string;
  shiprocket_default_weight_kg: string;
  shiprocket_default_length_cm: string;
  shiprocket_default_breadth_cm: string;
  shiprocket_default_height_cm: string;
  shiprocket_auto_create_order: string;
  home_categories: string;
}

export function SettingsClient({
  profile,
  store,
}: {
  profile: Profile;
  store: StoreSettings;
}) {
  const router = useRouter();

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-6">
          <ProfileForm initial={profile} onSaved={() => router.refresh()} />
        </div>
        <div className="col-md-6">
          <PasswordForm />
        </div>
        <div className="col-12 mt-3">
          <StoreSettingsForm
            initial={store}
            onSaved={() => router.refresh()}
          />
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/*  Profile                                                                 */
/* ----------------------------------------------------------------------- */
function ProfileForm({
  initial,
  onSaved,
}: {
  initial: Profile;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [topErr, setTopErr] = useState<string | null>(null);

  const update = (key: keyof Profile, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErrors({});
    setMsg(null);
    setTopErr(null);
    try {
      const res = await fetch("/api/admin/settings/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name,
          company_name: form.company_name,
        }),
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
        setTopErr(data.message ?? "Failed to update profile");
        return;
      }
      setMsg("Profile updated successfully.");
      onSaved();
    } catch {
      setTopErr("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="card-header pb-0">
        <h5>Profile</h5>
      </div>
      <div className="card-body">
        {topErr ? <div className="alert alert-danger">{topErr}</div> : null}
        {msg ? <div className="alert alert-success">{msg}</div> : null}
        <form className="row g-3" onSubmit={onSubmit} noValidate>
          <div className="col-md-12">
            <label className="form-label">Company Name</label>
            <input
              type="text"
              className={`form-control ${errors.company_name ? "is-invalid" : ""}`}
              value={form.company_name}
              onChange={(e) => update("company_name", e.target.value)}
            />
            {errors.company_name ? (
              <div className="invalid-feedback">{errors.company_name}</div>
            ) : null}
          </div>
          <div className="col-md-6">
            <label className="form-label">First Name</label>
            <input
              type="text"
              className={`form-control ${errors.first_name ? "is-invalid" : ""}`}
              value={form.first_name}
              onChange={(e) => update("first_name", e.target.value)}
              required
            />
            {errors.first_name ? (
              <div className="invalid-feedback">{errors.first_name}</div>
            ) : null}
          </div>
          <div className="col-md-6">
            <label className="form-label">Last Name</label>
            <input
              type="text"
              className={`form-control ${errors.last_name ? "is-invalid" : ""}`}
              value={form.last_name}
              onChange={(e) => update("last_name", e.target.value)}
              required
            />
            {errors.last_name ? (
              <div className="invalid-feedback">{errors.last_name}</div>
            ) : null}
          </div>
          <div className="col-md-12">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={form.email}
              readOnly
              disabled
            />
            <small className="text-muted">
              Email is fixed for the admin account.
            </small>
          </div>
          <div className="col-12 d-flex gap-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy}
            >
              {busy ? "Updating…" : "Update Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/*  Password                                                                */
/* ----------------------------------------------------------------------- */
function PasswordForm() {
  const [oldPw, setOldPw] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [topErr, setTopErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErrors({});
    setMsg(null);
    setTopErr(null);
    try {
      const res = await fetch("/api/admin/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          old_password: oldPw,
          password: pw,
          password_confirmation: pw2,
        }),
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
        setTopErr(data.message ?? "Failed to update password");
        return;
      }
      setMsg("Password updated successfully.");
      setOldPw("");
      setPw("");
      setPw2("");
    } catch {
      setTopErr("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="card-header pb-0">
        <h5>Change Password</h5>
      </div>
      <div className="card-body">
        {topErr ? <div className="alert alert-danger">{topErr}</div> : null}
        {msg ? <div className="alert alert-success">{msg}</div> : null}
        <form className="row g-3" onSubmit={onSubmit} noValidate>
          <div className="col-12">
            <label className="form-label">Current Password</label>
            <input
              type="password"
              className={`form-control ${errors.old_password ? "is-invalid" : ""}`}
              value={oldPw}
              onChange={(e) => setOldPw(e.target.value)}
              required
            />
            {errors.old_password ? (
              <div className="invalid-feedback">{errors.old_password}</div>
            ) : null}
          </div>
          <div className="col-12">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className={`form-control ${errors.password ? "is-invalid" : ""}`}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              minLength={8}
              required
            />
            {errors.password ? (
              <div className="invalid-feedback">{errors.password}</div>
            ) : null}
          </div>
          <div className="col-12">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className={`form-control ${errors.password_confirmation ? "is-invalid" : ""}`}
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              minLength={8}
              required
            />
            {errors.password_confirmation ? (
              <div className="invalid-feedback">
                {errors.password_confirmation}
              </div>
            ) : null}
          </div>
          <div className="col-12 d-flex gap-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy}
            >
              {busy ? "Updating…" : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/*  Store settings (COD fee, Shiprocket pickup, etc.)                       */
/* ----------------------------------------------------------------------- */

interface CategoryItem {
  name: string;
  type: string;
  image: string;
}

const PRODUCT_TYPES_LIST = [
  { value: "bestseller", label: "Bestseller (Miniature Frame)" },
  { value: "birthday", label: "Birthday" },
  { value: "wedding-anniversary", label: "Wedding & Anniversary" },
  { value: "mothers-day", label: "Mother's Day" },
  { value: "fathers-day", label: "Father's Day" },
  { value: "teachers-day", label: "Teacher's Day" },
  { value: "natural-wooden-slice", label: "Natural Wooden Slice" },
  { value: "rectangle-wooden-frame", label: "Rectangle Wooden Frame" },
  { value: "corporate-gifts", label: "Corporate Gifts" },
];

function StoreSettingsForm({
  initial,
  onSaved,
}: {
  initial: StoreSettings;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [topErr, setTopErr] = useState<string | null>(null);

  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    try {
      return JSON.parse(form.home_categories || "[]");
    } catch {
      return [];
    }
  });

  const updateCategories = (newCats: CategoryItem[]) => {
    setCategories(newCats);
    setForm((p) => ({ ...p, home_categories: JSON.stringify(newCats) }));
  };

  const handleNameChange = (idx: number, name: string) => {
    const next = [...categories];
    next[idx] = { ...next[idx], name };
    updateCategories(next);
  };

  const handleTypeChange = (idx: number, type: string) => {
    const next = [...categories];
    next[idx] = { ...next[idx], type };
    updateCategories(next);
  };

  const handleImageUpload = async (idx: number, file: File) => {
    const fd = new FormData();
    fd.append("image", file);
    try {
      const res = await fetch("/api/admin/upload-category-image", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const next = [...categories];
        next[idx] = { ...next[idx], image: data.data.url };
        updateCategories(next);
      } else {
        alert(data.message || "Failed to upload image.");
      }
    } catch (e) {
      alert("Error uploading image.");
    }
  };

  const moveCat = (idx: number, dir: -1 | 1) => {
    const next = [...categories];
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= next.length) return;
    const temp = next[idx];
    next[idx] = next[targetIdx];
    next[targetIdx] = temp;
    updateCategories(next);
  };

  const addCategory = () => {
    const next = [
      ...categories,
      { name: "New Category", type: "birthday", image: "/img/brithday.webp" },
    ];
    updateCategories(next);
  };

  const deleteCategory = (idx: number) => {
    if (!confirm("Are you sure you want to remove this category?")) return;
    const next = categories.filter((_, i) => i !== idx);
    updateCategories(next);
  };

  const update = (key: keyof StoreSettings, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErrors({});
    setMsg(null);
    setTopErr(null);
    try {
      const res = await fetch("/api/admin/settings/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cod_enabled: Number(form.cod_enabled),
          cod_fee: Number(form.cod_fee),
          cod_min_order_amount: Number(form.cod_min_order_amount),
          cod_max_order_amount: Number(form.cod_max_order_amount),
          default_shipping_fee: Number(form.default_shipping_fee),
          shiprocket_pickup_location: form.shiprocket_pickup_location,
          shiprocket_default_weight_kg: Number(form.shiprocket_default_weight_kg),
          shiprocket_default_length_cm: Number(form.shiprocket_default_length_cm),
          shiprocket_default_breadth_cm: Number(
            form.shiprocket_default_breadth_cm,
          ),
          shiprocket_default_height_cm: Number(form.shiprocket_default_height_cm),
          shiprocket_auto_create_order: Number(
            form.shiprocket_auto_create_order,
          ),
          home_categories: form.home_categories,
        }),
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
        setTopErr(data.message ?? "Failed to save settings");
        return;
      }
      setMsg("Store settings updated successfully.");
      onSaved();
    } catch {
      setTopErr("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="card-header pb-0">
        <h5>Store Settings (COD &amp; Shipping)</h5>
        <small className="text-muted">
          These values are read by the storefront checkout. Changes apply
          immediately for new orders.
        </small>
      </div>
      <div className="card-body">
        {topErr ? <div className="alert alert-danger">{topErr}</div> : null}
        {msg ? <div className="alert alert-success">{msg}</div> : null}

        <form className="row g-3" onSubmit={onSubmit} noValidate>
          {/* ---- COD section ---- */}
          <div className="col-12">
            <h6 className="mb-2">Cash on Delivery</h6>
          </div>

          <div className="col-md-3">
            <label className="form-label">COD Enabled</label>
            <select
              className="form-select"
              value={form.cod_enabled}
              onChange={(e) => update("cod_enabled", e.target.value)}
            >
              <option value="1">Yes</option>
              <option value="0">No</option>
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label">COD Handling Fee</label>
            <div className="input-group">
              <span className="input-group-text">₹</span>
              <input
                type="number"
                min={0}
                step="1"
                className={`form-control ${errors.cod_fee ? "is-invalid" : ""}`}
                value={form.cod_fee}
                onChange={(e) => update("cod_fee", e.target.value)}
              />
            </div>
            {errors.cod_fee ? (
              <div className="invalid-feedback d-block">{errors.cod_fee}</div>
            ) : null}
          </div>
          <div className="col-md-3">
            <label className="form-label">COD Min Order</label>
            <div className="input-group">
              <span className="input-group-text">₹</span>
              <input
                type="number"
                min={0}
                step="1"
                className="form-control"
                value={form.cod_min_order_amount}
                onChange={(e) =>
                  update("cod_min_order_amount", e.target.value)
                }
              />
            </div>
            <small className="text-muted">0 = no minimum.</small>
          </div>
          <div className="col-md-3">
            <label className="form-label">COD Max Order</label>
            <div className="input-group">
              <span className="input-group-text">₹</span>
              <input
                type="number"
                min={0}
                step="1"
                className="form-control"
                value={form.cod_max_order_amount}
                onChange={(e) =>
                  update("cod_max_order_amount", e.target.value)
                }
              />
            </div>
            <small className="text-muted">0 = no maximum.</small>
          </div>

          {/* ---- Shipping section ---- */}
          <div className="col-12 mt-3">
            <h6 className="mb-2">Shipping (Shiprocket)</h6>
          </div>

          <div className="col-md-3">
            <label className="form-label">Default Shipping Fee</label>
            <div className="input-group">
              <span className="input-group-text">₹</span>
              <input
                type="number"
                min={0}
                step="1"
                className="form-control"
                value={form.default_shipping_fee}
                onChange={(e) =>
                  update("default_shipping_fee", e.target.value)
                }
              />
            </div>
            <small className="text-muted">
              0 = free shipping. Coupon free_shipping always wins.
            </small>
          </div>

          <div className="col-md-3">
            <label className="form-label">Pickup Location</label>
            <input
              type="text"
              className={`form-control ${errors.shiprocket_pickup_location ? "is-invalid" : ""}`}
              value={form.shiprocket_pickup_location}
              onChange={(e) =>
                update("shiprocket_pickup_location", e.target.value)
              }
            />
            {errors.shiprocket_pickup_location ? (
              <div className="invalid-feedback">
                {errors.shiprocket_pickup_location}
              </div>
            ) : (
              <small className="text-muted">
                Nickname configured in Shiprocket → Settings → Pickup Addresses.
              </small>
            )}
          </div>

          <div className="col-md-3">
            <label className="form-label">Auto-create Shiprocket Order</label>
            <select
              className="form-select"
              value={form.shiprocket_auto_create_order}
              onChange={(e) =>
                update("shiprocket_auto_create_order", e.target.value)
              }
            >
              <option value="1">Yes</option>
              <option value="0">No</option>
            </select>
          </div>

          <div className="col-md-3" />

          {/* ---- Default package dimensions ---- */}
          <div className="col-md-3">
            <label className="form-label">Default Weight (kg)</label>
            <input
              type="number"
              min={0.01}
              step="0.01"
              className="form-control"
              value={form.shiprocket_default_weight_kg}
              onChange={(e) =>
                update("shiprocket_default_weight_kg", e.target.value)
              }
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Default Length (cm)</label>
            <input
              type="number"
              min={1}
              step="1"
              className="form-control"
              value={form.shiprocket_default_length_cm}
              onChange={(e) =>
                update("shiprocket_default_length_cm", e.target.value)
              }
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Default Breadth (cm)</label>
            <input
              type="number"
              min={1}
              step="1"
              className="form-control"
              value={form.shiprocket_default_breadth_cm}
              onChange={(e) =>
                update("shiprocket_default_breadth_cm", e.target.value)
              }
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Default Height (cm)</label>
            <input
              type="number"
              min={1}
              step="1"
              className="form-control"
              value={form.shiprocket_default_height_cm}
              onChange={(e) =>
                update("shiprocket_default_height_cm", e.target.value)
              }
            />
          </div>

          {/* ---- Categories section ---- */}
          <div className="col-12 mt-4 pt-3 border-top">
            <h6 className="mb-2">Homepage Category Cards</h6>
            <p className="text-muted small">
              These cards are displayed in the "Our Category" section on the homepage. You can upload custom images, change display names, choose product filters, and re-order them.
            </p>
          </div>

          <div className="col-12">
            <div className="row g-3">
              {categories.map((cat, idx) => (
                <div key={idx} className="col-md-6 col-lg-4">
                  <div className="card h-100 border p-3">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div className="position-relative" style={{ width: 64, height: 64, flexShrink: 0 }}>
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="img-fluid rounded border"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                      <div className="flex-grow-1">
                        <label className="form-label mb-1 small fw-semibold">Upload Image</label>
                        <input
                          type="file"
                          className="form-control form-control-sm"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(idx, file);
                          }}
                        />
                      </div>
                    </div>

                    <div className="mb-2">
                      <label className="form-label mb-1 small fw-semibold">Display Name</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={cat.name}
                        onChange={(e) => handleNameChange(idx, e.target.value)}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label mb-1 small fw-semibold">Link Type / Filter</label>
                      <select
                        className="form-select form-select-sm"
                        value={cat.type}
                        onChange={(e) => handleTypeChange(idx, e.target.value)}
                      >
                        {PRODUCT_TYPES_LIST.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="d-flex justify-content-between mt-auto pt-2 border-top">
                      <div className="d-flex gap-1">
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-xs px-2"
                          onClick={() => moveCat(idx, -1)}
                          disabled={idx === 0}
                          title="Move Left/Up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-xs px-2"
                          onClick={() => moveCat(idx, 1)}
                          disabled={idx === categories.length - 1}
                          title="Move Right/Down"
                        >
                          ↓
                        </button>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-xs px-2"
                        onClick={() => deleteCategory(idx)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="col-12 mt-3">
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={addCategory}
                >
                  + Add Category Card
                </button>
              </div>
            </div>
          </div>

          <div className="col-12 d-flex gap-2 mt-4 pt-3 border-top">
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Saving…" : "Save Store Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
