import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";

import { trackByAwb } from "@/lib/shiprocket";
import { db } from "@/lib/db";
import { shippingDetails } from "@/lib/db/schema";
import { readSession } from "@/lib/auth";
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
  searchParams: Promise<{ email?: string }>;
}

/**
 * Public-ish parcel tracking page.
 *
 * Anonymous visitors must provide `?email=...` matching the email on the
 * order whose AWB they're viewing. Without it we render a tiny lookup
 * form instead of the full timeline — same protection the API enforces,
 * but with a friendlier UX than a bare 404.
 */
export default async function TrackingPage({ params, searchParams }: PageProps) {
  const { awb } = await params;
  const sp = await searchParams;
  const code = String(awb || "").trim();
  const askedEmail = (sp.email ?? "").trim().toLowerCase();

  let result: Awaited<ReturnType<typeof trackByAwb>> | null = null;
  let error: string | null = null;
  let needsEmail = false;

  if (!/^[A-Za-z0-9_-]{6,32}$/.test(code)) {
    error = "Invalid AWB code.";
  } else {
    const [shipping] = await db
      .select({
        userId: shippingDetails.user_id,
        email: shippingDetails.email,
      })
      .from(shippingDetails)
      .where(eq(shippingDetails.awb_code, code))
      .limit(1);

    if (!shipping) {
      error = "We couldn't find tracking for that AWB.";
    } else {
      const session = await readSession();
      const isOwner =
        session?.sub != null &&
        shipping.userId != null &&
        Number(shipping.userId) === session.sub;
      const orderEmail = (shipping.email ?? "").trim().toLowerCase();
      const emailOk = !!askedEmail && askedEmail === orderEmail;

      if (!isOwner && !emailOk) {
        needsEmail = true;
      } else {
        try {
          result = await trackByAwb(code);
        } catch (err) {
          error =
            err instanceof Error
              ? err.message
              : "Couldn't load tracking information.";
        }
      }
    }
  }

  return (
    <div className="container order-success-wrapper">
      <div className="order-success-card" style={{ maxWidth: 720 }}>
        <h1 style={{ marginBottom: 6 }}>Track your order</h1>
        <div className="text-muted small">AWB: {code}</div>

        {needsEmail ? (
          <form method="get" className="my-4">
            <p className="text-muted">
              Enter the email used on the order to view this shipment&apos;s
              tracking.
            </p>
            <input
              type="email"
              name="email"
              placeholder="Order email"
              required
              className="form-control"
              autoComplete="email"
              style={{ maxWidth: 360 }}
            />
            <button type="submit" className="btn-primary-themed mt-3">
              Show tracking
            </button>
          </form>
        ) : error ? (
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
