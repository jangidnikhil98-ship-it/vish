"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/components/AuthProvider";
import "../(auth)/auth.css";

interface FieldErrors {
  email?: string;
  password?: string;
}

export default function LoginClient() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, refresh } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = params.get("redirect") || "/";

  // If already logged in, bounce to redirect target.
  useEffect(() => {
    if (user) router.replace(redirectTo);
  }, [user, redirectTo, router]);

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!email.trim()) next.email = "Please enter an email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()))
      next.email = "Please enter a valid email address";

    if (!password) next.password = "Please enter a password";
    else if (password.length < 8)
      next.password = "Your password must be at least 8 characters long";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.success) {
        await refresh();
        router.push(redirectTo);
        router.refresh();
        return;
      }

      if (res.status === 422 && data?.errors) {
        setErrors({
          email: data.errors.email?.[0],
          password: data.errors.password?.[0],
        });
        return;
      }

      setBanner({
        kind: "error",
        text:
          data?.message ||
          "The provided credentials do not match our records.",
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

  return (
    <section className="login-section">
      <div className="login-container">
        <h1>Login</h1>

        {banner && (
          <div className={`auth-banner ${banner.kind}`}>{banner.text}</div>
        )}

        <form id="formValidation" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={errors.email ? "is-invalid" : ""}
              autoComplete="email"
            />
            {errors.email && (
              <small className="field-error">{errors.email}</small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={errors.password ? "is-invalid" : ""}
              autoComplete="current-password"
            />
            <span
              className="password-toggle"
              id="toggle-password"
              onClick={() => setShowPassword((s) => !s)}
              role="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  setShowPassword((s) => !s);
              }}
            >
              <i
                id="toggleIcon"
                className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
              />
            </span>
            {errors.password && (
              <small className="field-error">{errors.password}</small>
            )}
          </div>

          <button type="submit" className="login-btn" disabled={submitting}>
            {submitting ? "Logging in…" : "Login"}
          </button>

          <div className="forgot-password">
            <Link href="/forgot-password">Forgot Password?</Link>
            <Link href="/register">Sign up</Link>
          </div>
        </form>
      </div>
    </section>
  );
}
