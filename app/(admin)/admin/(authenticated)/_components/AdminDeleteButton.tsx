"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Drop-in replacement for the original
 *
 *   <a class="btn btn-pill btn-danger delete-btn deleteRecord" data-id=...>
 *
 * pattern that every admin index page used. Click → confirm → DELETE call
 * → router.refresh() so the row disappears without a full page reload.
 *
 * `endpoint` is the DELETE URL (e.g. `/api/admin/users/123`). We use a
 * native `confirm()` for now to keep the bundle tiny — switch to the
 * Bootstrap modal later if needed.
 */
export function AdminDeleteButton({
  endpoint,
  label = "Delete",
  confirmText = "Are you sure you want to delete this?",
}: {
  endpoint: string;
  label?: string;
  confirmText?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (busy) return;
    if (typeof window !== "undefined" && !window.confirm(confirmText)) return;

    setBusy(true);
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
      };
      if (!res.ok || data.success === false) {
        window.alert(data.message ?? "Delete failed");
        return;
      }
      router.refresh();
    } catch {
      window.alert("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="btn btn-pill btn-danger btn-air-danger btn-sm delete-btn"
    >
      {busy ? "…" : label}
    </button>
  );
}
