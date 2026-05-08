"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  orderId: number;
  /** Currently "pending" | "paid" | "failed". */
  paymentStatus: string;
}

export function MarkPaidButton({ orderId, paymentStatus }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (paymentStatus === "paid") {
    return (
      <div className="alert alert-success py-2 mb-0">
        ✓ Cash collected — payment completed.
      </div>
    );
  }

  async function onClick() {
    if (busy) return;
    if (
      !confirm(
        "Confirm: cash has been collected from the customer for this COD order?",
      )
    )
      return;
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/mark-paid`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErr(data.message ?? "Failed to mark as paid.");
        return;
      }
      setMsg(data.data?.message ?? "Order marked as paid.");
      router.refresh();
    } catch {
      setErr("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {err ? <div className="alert alert-danger py-2">{err}</div> : null}
      {msg ? <div className="alert alert-success py-2">{msg}</div> : null}
      <button
        type="button"
        className="btn btn-primary btn-sm"
        disabled={busy}
        onClick={onClick}
      >
        {busy ? "Working…" : "✓ Mark as paid (cash collected)"}
      </button>
      <small className="d-block text-muted mt-2">
        Use this once the courier confirms cash collection on delivery.
      </small>
    </div>
  );
}
