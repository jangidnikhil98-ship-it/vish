"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/app/components/AuthProvider";

type ProfileValues = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
};

type FieldErrors = Partial<Record<keyof ProfileValues, string>>;

export default function ProfileForm({ initial }: { initial: ProfileValues }) {
  const { refresh } = useAuth();
  const [values, setValues] = useState<ProfileValues>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const setField = <K extends keyof ProfileValues>(
    key: K,
    value: ProfileValues[K],
  ) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!values.first_name.trim()) next.first_name = "First name is required";
    if (values.phone && !/^\d{10}$/.test(values.phone))
      next.phone = "Phone must be exactly 10 digits";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBanner(null);
    if (!validate()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: values.first_name.trim(),
          last_name: values.last_name.trim(),
          phone: values.phone.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.success) {
        await refresh();
        setBanner({ kind: "success", text: "Profile updated successfully." });
        return;
      }

      if (res.status === 422 && data?.errors) {
        const fe: FieldErrors = {};
        for (const [k, msgs] of Object.entries(data.errors)) {
          fe[k as keyof ProfileValues] = (msgs as string[])?.[0];
        }
        setErrors(fe);
        return;
      }

      setBanner({
        kind: "error",
        text: data?.message ?? "Could not save your profile. Please try again.",
      });
    } catch {
      setBanner({
        kind: "error",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="dashboard-form" noValidate>
      {banner && (
        <div className={`dashboard-banner is-${banner.kind}`} role="status">
          {banner.text}
        </div>
      )}

      <div className="dashboard-form-row">
        <div className="dashboard-form-group">
          <label htmlFor="first_name">First name</label>
          <input
            id="first_name"
            type="text"
            value={values.first_name}
            onChange={(e) => setField("first_name", e.target.value)}
            className={errors.first_name ? "is-invalid" : ""}
            autoComplete="given-name"
          />
          {errors.first_name && (
            <small className="field-error">{errors.first_name}</small>
          )}
        </div>

        <div className="dashboard-form-group">
          <label htmlFor="last_name">Last name</label>
          <input
            id="last_name"
            type="text"
            value={values.last_name}
            onChange={(e) => setField("last_name", e.target.value)}
            autoComplete="family-name"
          />
        </div>
      </div>

      <div className="dashboard-form-row">
        <div className="dashboard-form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={values.email}
            disabled
            readOnly
            autoComplete="email"
            aria-describedby="email-help"
          />
          <small id="email-help" className="text-muted">
            Email is used to sign in and cannot be changed here.
          </small>
        </div>

        <div className="dashboard-form-group">
          <label htmlFor="phone">Phone (10 digits)</label>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={values.phone}
            onChange={(e) =>
              setField(
                "phone",
                e.target.value.replace(/\D/g, "").slice(0, 10),
              )
            }
            className={errors.phone ? "is-invalid" : ""}
            autoComplete="tel"
            placeholder="9876543210"
          />
          {errors.phone && (
            <small className="field-error">{errors.phone}</small>
          )}
        </div>
      </div>

      <div className="dashboard-form-actions">
        <button
          type="submit"
          className="btn-primary-themed"
          disabled={saving}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
