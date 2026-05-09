"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Admin "Send to Shiprocket" button on the order detail page.
 *
 * Shows different copy depending on current Shiprocket state:
 *   - Not pushed yet         → "Send to Shiprocket"
 *   - Already pushed (no AWB) → "Re-assign AWB" (best-effort retry)
 *   - Has AWB                → hidden (parent renders the AWB block instead)
 *
 * Disabled for cancelled orders or unpaid prepaid orders — the server also
 * enforces both guards, this is just nicer UX.
 */
export function PushToShiprocketButton({
  orderId,
  status,
  paymentMethod,
  paymentStatus,
  shiprocketOrderId,
  awbCode,
  helperText = true,
  fullWidth = true,
}: {
  orderId: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  shiprocketOrderId: string | null;
  awbCode: string | null;
  helperText?: boolean;
  fullWidth?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(
    null,
  );

  const isCancelled = status === "cancelled";
  const needsPayment =
    paymentMethod !== "cod" && paymentStatus !== "paid";
  const alreadyHasAwb = !!awbCode;
  const alreadyPushed = !!shiprocketOrderId;

  // The parent renders the full AWB card, so once we have an AWB this
  // button is redundant.
  if (alreadyHasAwb) return null;

  async function onClick() {
    if (busy) return;
    if (
      !window.confirm(
        alreadyPushed
          ? "Try assigning an AWB again for this order?"
          : "Send this order's details to Shiprocket now?",
      )
    ) {
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(
        `/api/admin/orders/${orderId}/push-shiprocket`,
        { method: "POST" },
      );
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
        data?: { message?: string };
      };
      if (!res.ok || data.success === false) {
        setMsg({
          kind: "error",
          text:
            data.message ??
            "Couldn't send to Shiprocket. Please check the settings page.",
        });
        return;
      }
      setMsg({
        kind: "success",
        text: data.data?.message ?? "Sent to Shiprocket.",
      });
      // Re-fetch the page so the parent re-renders the SR card.
      router.refresh();
    } catch {
      setMsg({
        kind: "error",
        text: "Network error. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  let disabledReason: string | null = null;
  if (isCancelled) disabledReason = "This order is cancelled.";
  else if (needsPayment)
    disabledReason = "Wait for online payment to complete (or mark as paid).";

  return (
    <div>
      <button
        type="button"
        className={`btn btn-primary ${fullWidth ? "w-100" : ""}`}
        onClick={onClick}
        disabled={busy || !!disabledReason}
        title={disabledReason ?? undefined}
      >
        {busy
          ? "Sending…"
          : alreadyPushed
            ? "Re-assign AWB"
            : "Send to Shiprocket"}
      </button>
      {helperText && disabledReason ? (
        <small className="text-muted d-block mt-2">{disabledReason}</small>
      ) : null}
      {helperText && !disabledReason ? (
        <small className="text-muted d-block mt-2">
          Pushes the order, billing/shipping address and items to your
          Shiprocket dashboard, and tries to auto-assign an AWB.
        </small>
      ) : null}
      {msg ? (
        <div
          className={
            "mt-2 small " +
            (msg.kind === "error" ? "text-danger" : "text-success")
          }
          role={msg.kind === "error" ? "alert" : "status"}
        >
          {msg.text}
        </div>
      ) : null}
    </div>
  );
}
