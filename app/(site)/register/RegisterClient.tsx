"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/components/AuthProvider";
import "../(auth)/auth.css";

interface FieldErrors {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
}

export default function RegisterClient() {
  const router = useRouter();
  const { user, refresh } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!firstName.trim()) next.first_name = "Please enter your first name";
    if (!lastName.trim()) next.last_name = "Please enter your last name";

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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.success) {
        await refresh();
        router.push("/");
        router.refresh();
        return;
      }

      if (res.status === 422 && data?.errors) {
        setErrors({
          first_name: data.errors.first_name?.[0],
          last_name: data.errors.last_name?.[0],
          email: data.errors.email?.[0],
          password: data.errors.password?.[0],
        });
        return;
      }

      setBanner({
        kind: "error",
        text:
          data?.message ||
          "Registration failed. Please try again.",
      });
    } catch {
      setBanner({
        kind: "error",
        text: "An error occurred during registration. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="login-section register-section">
      <div className="login-container">
        <h1>Register</h1>

        {banner && (
          <div className={`auth-banner ${banner.kind}`}>{banner.text}</div>
        )}

        <form id="registrationForm" onSubmit={handleSubmit} noValidate>
          <div className="register-form">
            <div className="form-group">
              <label htmlFor="first_name">First Name</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                placeholder="Enter your first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={errors.first_name ? "is-invalid" : ""}
                autoComplete="given-name"
              />
              {errors.first_name && (
                <small className="field-error">{errors.first_name}</small>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="last_name">Last Name</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                placeholder="Enter your last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={errors.last_name ? "is-invalid" : ""}
                autoComplete="family-name"
              />
              {errors.last_name && (
                <small className="field-error">{errors.last_name}</small>
              )}
            </div>
          </div>

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
              autoComplete="new-password"
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
            {submitting ? "Creating account…" : "Register"}
          </button>

          <div className="forgot-password rember-password">
            Already have an account? <Link href="/login">Login</Link>
          </div>
        </form>
      </div>
    </section>
  );
}
