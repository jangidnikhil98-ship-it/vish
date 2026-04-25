"use client";

import { useState, type FormEvent } from "react";

type FieldErrors = Partial<
  Record<"full_name" | "email" | "phone" | "message", string>
>;

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export default function ContactForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [errors, setErrors] = useState<FieldErrors>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status.kind === "submitting") return;

    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      full_name: String(data.get("full_name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
      message: String(data.get("message") ?? "").trim(),
    };

    setErrors({});
    setStatus({ kind: "submitting" });

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));

      if (res.ok && json?.success) {
        setStatus({
          kind: "success",
          message:
            json.data?.message ??
            "Thank you! Your enquiry has been submitted successfully.",
        });
        form.reset();
        return;
      }

      // Validation error from API (zod -> 422)
      if (res.status === 422 && json?.errors) {
        const flat: FieldErrors = {};
        for (const [key, val] of Object.entries(
          json.errors as Record<string, string[]>,
        )) {
          if (Array.isArray(val) && val[0]) {
            flat[key as keyof FieldErrors] = val[0];
          }
        }
        setErrors(flat);
        setStatus({
          kind: "error",
          message: json.message ?? "Please fix the highlighted fields.",
        });
        return;
      }

      setStatus({
        kind: "error",
        message: json?.message ?? "Something went wrong. Please try again.",
      });
    } catch {
      setStatus({
        kind: "error",
        message: "Network error. Please check your connection and try again.",
      });
    }
  }

  const submitting = status.kind === "submitting";

  return (
    <form id="contactForm" onSubmit={onSubmit} noValidate>
      {status.kind === "success" && (
        <div className="alert alert-success" role="alert">
          {status.message}
        </div>
      )}
      {status.kind === "error" && (
        <div className="alert alert-danger" role="alert">
          {status.message}
        </div>
      )}

      <div className="mb-3">
        <label className="form-label" htmlFor="full_name">
          Your Name
        </label>
        <input
          id="full_name"
          type="text"
          name="full_name"
          className={`form-control ${errors.full_name ? "is-invalid" : ""}`}
          maxLength={255}
          required
          disabled={submitting}
        />
        {errors.full_name && (
          <div className="invalid-feedback">{errors.full_name}</div>
        )}
      </div>

      <div className="mb-3">
        <label className="form-label" htmlFor="email">
          Your Email
        </label>
        <input
          id="email"
          type="email"
          name="email"
          className={`form-control ${errors.email ? "is-invalid" : ""}`}
          maxLength={255}
          required
          disabled={submitting}
        />
        {errors.email && (
          <div className="invalid-feedback">{errors.email}</div>
        )}
      </div>

      <div className="mb-3">
        <label className="form-label" htmlFor="phone">
          WhatsApp Number
        </label>
        <input
          id="phone"
          type="tel"
          name="phone"
          className={`form-control ${errors.phone ? "is-invalid" : ""}`}
          pattern="[0-9]{10}"
          maxLength={10}
          inputMode="numeric"
          required
          disabled={submitting}
        />
        {errors.phone ? (
          <div className="invalid-feedback">{errors.phone}</div>
        ) : (
          <small className="text-muted">
            Enter 10 digit WhatsApp number (without country code)
          </small>
        )}
      </div>

      <div className="mb-3">
        <label className="form-label" htmlFor="message">
          Your Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className={`form-control ${errors.message ? "is-invalid" : ""}`}
          maxLength={5000}
          required
          disabled={submitting}
        />
        {errors.message && (
          <div className="invalid-feedback">{errors.message}</div>
        )}
      </div>

      <button type="submit" className="btn theme-btn" disabled={submitting}>
        {submitting ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
