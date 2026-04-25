"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import "./admin-login.css";

/**
 * Mirrors `resources/views/backend/auth/login.blade.php` (Pixelstrap Zono
 * "login-card" / "login-dark" template) — same DOM, same classes, same
 * brand color (#603813). Form is wired to /api/admin/auth/login.
 */
export default function LoginClient() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!email.trim()) return "Please enter your email address.";
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email))
      return "Please enter a valid email address.";
    if (!password) return "Please enter your password.";
    if (password.length < 8)
      return "Password must be at least 8 characters long.";
    return null;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        message?: string;
        redirect_url?: string;
      };

      if (data.success) {
        router.push(data.redirect_url ?? "/admin/dashboard");
        router.refresh();
        return;
      }

      setError(data.message ?? "Incorrect email or password.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container-fluid p-0">
      <div className="row m-0">
        <div className="col-12 p-0">
          <div className="login-card login-dark">
            <div>
              <div>
                <a className="logo" href="/">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="img-fluid for-light"
                    src="/img/frontend/logo.png"
                    alt="loginpage"
                    width={600}
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="img-fluid for-dark"
                    src="/backend/images/logo/logo.svg"
                    alt="loginpage"
                  />
                </a>
              </div>
              <div className="login-main">
                <form
                  className="theme-form"
                  id="loginForm"
                  onSubmit={onSubmit}
                  noValidate
                >
                  <h3>Sign in to account</h3>
                  <p>Enter your email & password to login</p>

                  <div className="form-group">
                    <label className="col-form-label">Email Address</label>
                    <input
                      className="form-control"
                      type="email"
                      id="email"
                      name="email"
                      placeholder="Test@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="username"
                      style={{
                        backgroundColor: "#ede5db",
                        color: "black",
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="col-form-label">Password</label>
                    <div className="form-input">
                      <input
                        className="form-control"
                        type={showPwd ? "text" : "password"}
                        id="password"
                        name="password"
                        placeholder="*********"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        style={{
                          backgroundColor: "#ede5db",
                          color: "black",
                        }}
                      />
                      <div
                        className="show-hide"
                        onClick={() => setShowPwd((s) => !s)}
                        style={{ cursor: "pointer" }}
                      >
                        <span className={showPwd ? "hide" : "show"}>
                          {showPwd ? "hide" : "show"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="form-group mb-0">
                    <div className="checkbox p-0">
                      <input id="checkbox1" type="checkbox" />
                    </div>
                    <div className="text-end mt-3">
                      <button
                        className="btn btn-primary btn-block w-100"
                        type="submit"
                        disabled={submitting}
                        style={{
                          backgroundColor: "#603813",
                          borderColor: "#603813",
                        }}
                      >
                        {submitting ? "Signing in…" : "Sign in"}
                      </button>
                    </div>
                  </div>
                </form>

                <div id="loginMessage" className="mt-3">
                  {error ? (
                    <div className="alert alert-danger">{error}</div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
