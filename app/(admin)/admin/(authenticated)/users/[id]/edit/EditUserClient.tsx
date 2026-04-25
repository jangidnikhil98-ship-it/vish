"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface UserForm {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  city: string;
  country_code: string;
}

export function EditUserClient({ user }: { user: UserForm }) {
  const router = useRouter();
  const [form, setForm] = useState<UserForm>(user);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [topError, setTopError] = useState<string | null>(null);

  const update = (key: keyof UserForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setTopError(null);

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
          city: form.city,
          country_code: form.country_code,
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
        setTopError(data.message ?? "Failed to update user");
        return;
      }
      router.push(
        `/admin/users/${user.id}/edit?success=${encodeURIComponent(
          "Buyer profile has been updated successfully.",
        )}`,
      );
      router.refresh();
    } catch {
      setTopError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-sm-12">
          <div className="card">
            <div className="card-header pb-0">
              <h5>Edit User Profile</h5>
            </div>
            <div className="card-body">
              {topError ? (
                <div className="alert alert-danger">{topError}</div>
              ) : null}
              <form className="row g-3" onSubmit={onSubmit} noValidate>
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

                <div className="col-md-2">
                  <label className="form-label">Country Code</label>
                  <input
                    type="text"
                    className={`form-control ${errors.country_code ? "is-invalid" : ""}`}
                    value={form.country_code}
                    onChange={(e) => update("country_code", e.target.value)}
                    placeholder="91"
                    maxLength={6}
                  />
                  {errors.country_code ? (
                    <div className="invalid-feedback">
                      {errors.country_code}
                    </div>
                  ) : null}
                </div>
                <div className="col-md-4">
                  <label className="form-label">Mobile</label>
                  <input
                    type="text"
                    className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    required
                  />
                  {errors.phone ? (
                    <div className="invalid-feedback">{errors.phone}</div>
                  ) : null}
                </div>
                <div className="col-md-6">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className={`form-control ${errors.city ? "is-invalid" : ""}`}
                    value={form.city}
                    onChange={(e) => update("city", e.target.value)}
                  />
                  {errors.city ? (
                    <div className="invalid-feedback">{errors.city}</div>
                  ) : null}
                </div>

                <div className="col-12 d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? "Updating…" : "Update Profile"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
