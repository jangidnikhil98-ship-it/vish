"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STATUSES = ["pending", "processing", "completed", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

export function OrderStatusForm({
  orderId,
  current,
}: {
  orderId: number;
  current: string;
}) {
  const router = useRouter();
  const initial: Status =
    (STATUSES as readonly string[]).includes(current)
      ? (current as Status)
      : "pending";
  const [status, setStatus] = useState<Status>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErr(data.message ?? "Failed to update status");
        return;
      }
      setMsg("Order status updated.");
      router.refresh();
    } catch {
      setErr("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      {msg ? <div className="alert alert-success py-2">{msg}</div> : null}
      {err ? <div className="alert alert-danger py-2">{err}</div> : null}
      <select
        className="form-select mb-2"
        value={status}
        onChange={(e) => setStatus(e.target.value as Status)}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="btn btn-primary w-100"
        disabled={busy}
      >
        {busy ? "Updating…" : "Update Status"}
      </button>
    </form>
  );
}
