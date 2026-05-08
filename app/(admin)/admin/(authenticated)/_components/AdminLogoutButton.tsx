"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Logout link in the admin header dropdown. Performs a real `POST` to
 * `/api/admin/auth/logout` (the route is POST-only) and then navigates
 * to `/admin/login`.
 *
 * Was previously a `<a href="/api/admin/auth/logout">` GET link, which
 * broke in two ways:
 *   1. Any browser link-prefetch could silently sign the admin out.
 *   2. The endpoint is POST-only, so clicking actually rendered the JSON
 *      response in the browser instead of redirecting.
 */
export default function AdminLogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onLogout() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/admin/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Even if the network call fails the cookie is locally invalid
      // enough — fall through to the redirect.
    }
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={busy}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "none",
        border: 0,
        padding: 0,
        color: "inherit",
        font: "inherit",
        cursor: busy ? "wait" : "pointer",
        width: "100%",
        textAlign: "left",
      }}
    >
      <i data-feather="log-in" />
      <span>{busy ? "Signing out…" : "Log Out"}</span>
    </button>
  );
}
