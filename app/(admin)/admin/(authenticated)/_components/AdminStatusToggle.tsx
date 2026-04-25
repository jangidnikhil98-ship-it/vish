"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Pill button that flips the boolean `is_active` (or `status`) of a record
 * via a POST/PATCH to `endpoint`.
 *
 * Replaces the original
 *
 *   <a class="badge rounded-pill badge-success p-2 statusChange ..."
 *      data-id="..." data-table="..." data-status="0">Active</a>
 *
 * pattern. Body posted: { active: boolean } — the route handler decides
 * how to translate that to the underlying column (e.g. products use
 * status='active'/'inactive', users use is_active 0/1).
 */
export function AdminStatusToggle({
  endpoint,
  active: initialActive,
  activeLabel = "Active",
  inactiveLabel = "Inactive",
}: {
  endpoint: string;
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}) {
  const router = useRouter();
  const [active, setActive] = useState(initialActive);
  const [busy, setBusy] = useState(false);

  async function onClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const next = !active;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: next }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
      };
      if (!res.ok || data.success === false) {
        window.alert(data.message ?? "Failed to update status.");
        return;
      }
      setActive(next);
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
      className={
        "badge rounded-pill p-2 cursorPointer " +
        (active ? "badge-success" : "badge-danger")
      }
      style={{ border: "none" }}
    >
      {active ? activeLabel : inactiveLabel}
    </button>
  );
}
