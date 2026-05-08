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

  // Use a visible icon AND text — colour alone fails colour-blind users
  // and is what M-WCAG 1.4.1 calls out as "use of colour".
  const icon = active ? "✓" : "✗";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-pressed={active}
      aria-label={
        busy ? "Updating status…" : `Status: ${active ? activeLabel : inactiveLabel}. Click to change.`
      }
      title={`Status: ${active ? activeLabel : inactiveLabel}`}
      className={
        "badge rounded-pill p-2 " +
        (active ? "badge-success" : "badge-danger")
      }
      style={{
        border: "none",
        cursor: busy ? "wait" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span aria-hidden="true">{icon}</span>
      <span>{active ? activeLabel : inactiveLabel}</span>
    </button>
  );
}
