"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Profile {
  first_name: string;
  last_name: string;
  email: string;
  company_name: string;
}

export function SettingsClient({ profile }: { profile: Profile }) {
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
