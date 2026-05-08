import type { Metadata } from "next";
import Link from "next/link";

import { trackByAwb } from "@/lib/shiprocket";
import "../../order/success/success.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Track Order",
  description: "Track your order shipment status.",
  alternates: { canonical: "/track" },
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ awb: string }>;
}

export default async function TrackingPage({ params }: PageProps) {
  const { awb } = await params;
  const code = String(awb || "").trim();

  let result: Awaited<ReturnType<typeof trackByAwb>> | null = null;
  let error: string | null = null;
  if (/^[A-Za-z0-9_-]{6,32}$/.test(code)) {
    try {
      result = await trackByAwb(code);
    } catch (err) {
      error =
        err instanceof Error
          ? err.message
          : "Couldn't load tracking information.";
    }
  } else {
    error = "Invalid AWB code.";
  }

  return (
    <div className="container order-success-wrapper">
      <div className="order-success-card" style={{ maxWidth: 720 }}>
        <h1 style={{ marginBottom: 6 }}>Track your order</h1>
        <div className="text-muted small">AWB: {code}</div>

        {error ? (
          <p className="text-danger my-4">{error}</p>
        ) : !result ? (
          <p className="text-muted my-4">No tracking data available yet.</p>
        ) : (
          <>
            <div
              style={{
                marginTop: 18,
                padding: "14px 16px",
                background: "#fdf7ef",
                border: "1px solid rgba(96,56,19,0.18)",
                borderRadius: 10,
              }}
            >
              <strong>Current status:</strong>{" "}
              {result.currentStatus ?? "Awaiting first scan"}
            </div>

            {result.shipmentTrack && result.shipmentTrack.length > 0 ? (
              <ol
                className="text-start small mt-4"
                style={{ paddingLeft: 18, lineHeight: 1.7 }}
              >
                {result.shipmentTrack.map((s, i) => (
                  <li key={i}>
                    <strong>{s.status || s.activity}</strong>
                    {s.location ? ` — ${s.location}` : ""}
                    {s.date ? (
                      <span className="text-muted"> · {s.date}</span>
                    ) : null}
                    {s.activity && s.activity !== s.status ? (
                      <div className="text-muted">{s.activity}</div>
                    ) : null}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-muted my-4">
                The courier hasn&apos;t scanned the package yet. Check back in a
                few hours.
              </p>
            )}
          </>
        )}

        <div className="order-success-actions">
          <Link href="/dashboard/orders" className="btn-primary-themed">
            My orders
          </Link>
          <Link href="/" className="btn-secondary-themed">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
