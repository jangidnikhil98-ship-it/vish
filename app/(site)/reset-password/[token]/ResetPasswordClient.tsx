"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import "../../(auth)/auth.css";

interface FieldErrors {
  password?: string;
  repeatPassword?: string;
}

export default function ResetPasswordClient({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!password) next.password = "Please enter a password";
    else if (password.length < 8)
      next.password = "Your password must be at least 8 characters long";

    if (!repeatPassword) next.repeatPassword = "Please enter a password";
    else if (repeatPassword.length < 8)
      next.repeatPassword =
        "Your password must be at least 8 characters long";
    else if (repeatPassword !== password)
      next.repeatPassword = "Passwords do not match";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, repeatPassword }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.success) {
        setDone(true);
        setBanner({
          kind: "success",
          text:
            data?.message ||
            "Password updated successfully. You can now log in.",
        });
        return;
      }

      if (res.status === 422 && data?.errors) {
        setErrors({
          password: data.errors.password?.[0],
          repeatPassword: data.errors.repeatPassword?.[0],
        });
        return;
      }

      setBanner({
        kind: "error",
        text:
          data?.message ||
          "This password reset link is invalid or has expired.",
      });
    } catch {
      setBanner({
        kind: "error",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <section className="login-section">
        <div className="login-container">
          <h1>Password Changed</h1>
          {banner && (
            <div className={`auth-banner ${banner.kind}`}>{banner.text}</div>
          )}
          <button
            type="button"
            className="login-btn"
            onClick={() => router.push("/login")}
          >
            Login
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="login-section">
      <div className="login-container">
        <h1>Set new password</h1>

        {email && (
          <div className="auth-banner">
            Resetting password for <strong>{email}</strong>
          </div>
        )}
        {banner && (
          <div className={`auth-banner ${banner.kind}`}>{banner.text}</div>
        )}

        <form id="formValidation" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type={showPwd ? "text" : "password"}
              id="password"
              name="password"
              placeholder="*******"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={errors.password ? "is-invalid" : ""}
              autoComplete="new-password"
            />
            <span
              className="password-toggle"
              id="toggle-password"
              onClick={() => setShowPwd((s) => !s)}
              role="button"
              tabIndex={0}
              aria-label={showPwd ? "Hide password" : "Show password"}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setShowPwd((s) => !s);
              }}
            >
              <i className={`fas ${showPwd ? "fa-eye-slash" : "fa-eye"}`} />
            </span>
            {errors.password && (
              <small className="field-error">{errors.password}</small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="repeatPassword">Repeat Password</label>
            <input
              type={showRepeat ? "text" : "password"}
              id="repeatPassword"
              name="repeatPassword"
              placeholder="*******"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              className={errors.repeatPassword ? "is-invalid" : ""}
              autoComplete="new-password"
            />
            <span
              className="password-toggle"
              id="repeat-password"
              onClick={() => setShowRepeat((s) => !s)}
              role="button"
              tabIndex={0}
              aria-label={
                showRepeat ? "Hide password" : "Show password"
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  setShowRepeat((s) => !s);
              }}
            >
              <i className={`fas ${showRepeat ? "fa-eye-slash" : "fa-eye"}`} />
            </span>
            {errors.repeatPassword && (
              <small className="field-error">{errors.repeatPassword}</small>
            )}
          </div>

          <button type="submit" className="login-btn" disabled={submitting}>
            {submitting ? "Saving…" : "Change Password"}
          </button>

          <div className="forgot-password rember-password">
            <Link href="/login">Back to login</Link>
          </div>
        </form>
      </div>
    </section>
  );
}
