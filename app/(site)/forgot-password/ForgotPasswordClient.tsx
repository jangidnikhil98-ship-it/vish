"use client";

import Link from "next/link";
import { useState } from "react";
import "../(auth)/auth.css";

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function validate(): boolean {
    if (!email.trim()) {
      setError("Please enter an email");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError("Please enter a valid email address");
      return false;
    }
    setError(null);
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.success) {
        setDone(true);
        setBanner({
          kind: "success",
          text:
            data?.message ||
            "If an account exists for that email, we've sent a password reset link.",
        });
        return;
      }

      setBanner({
        kind: "error",
        text: data?.message || "Something went wrong. Please try again.",
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
        <h1>Password Reset</h1>

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
              className={error ? "is-invalid" : ""}
              autoComplete="email"
              disabled={done}
            />
            {error && <small className="field-error">{error}</small>}
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={submitting || done}
          >
            {submitting ? "Sending…" : done ? "Email sent" : "Reset Password"}
          </button>

          <div className="forgot-password rember-password">
            I remember my password. <Link href="/login">Login</Link>
          </div>
          <div className="forgot-password rember-password">
            You don&rsquo;t have an account? <Link href="/register">Sign Up</Link>
          </div>
        </form>
      </div>
    </section>
  );
}
