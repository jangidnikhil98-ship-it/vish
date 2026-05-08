import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { readSession } from "@/lib/auth";
import {
  getOrderByOrderNumber,
  getOrderByRazorpayId,
  type OrderSummary,
} from "@/lib/queries/orders";
import "./success.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "Thank you — your order has been received.",
  alternates: { canonical: "/order/success" },
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{
    order?: string;
    payment?: string;
    order_number?: string;
    method?: string;
  }>;
};

const formatINR = (n: number): string =>
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(n);

const formatDate = (d: Date | null): string => {
  if (!d) return "";
  return new Date(d).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export default async function OrderSuccessPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const razorpayOrderId = sp.order ?? "";
  const orderNumber = sp.order_number ?? "";

  let order: OrderSummary | null = null;
  const cookieStore = await cookies();
  const guestId = cookieStore.get("guest_id")?.value ?? null;
  const session = await readSession();

  try {
    if (razorpayOrderId) {
      order = await getOrderByRazorpayId({
        razorpayOrderId,
        guestId,
        userId: session?.sub ?? null,
      });
    } else if (orderNumber) {
      order = await getOrderByOrderNumber({
        orderNumber,
        guestId,
        userId: session?.sub ?? null,
      });
    }
  } catch (err) {
    console.error("[order/success] DB error:", err);
  }

  const isCod = order?.paymentMethod === "cod" || sp.method === "cod";

  return (
    <div className="container order-success-wrapper">
      <div className="order-success-card">
        <div className="order-success-icon" aria-hidden="true">
          ✓
        </div>
        <h1>
          {isCod
            ? "Order placed — pay on delivery"
            : "Thank you — your order is confirmed!"}
        </h1>
        <p className="text-muted">
          {isCod
            ? "We've emailed you the details. Please keep cash ready when our courier arrives."
            : "We've emailed you a receipt. Your gift will be crafted with love and shipped soon."}
        </p>

        {order ? (
          <>
            <div>
              Order number:{" "}
              <span className="order-number">{order.orderNumber}</span>
            </div>
            {order.createdAt && (
              <div className="text-muted small mt-1">
                Placed on {formatDate(order.createdAt)}
              </div>
            )}

            {isCod ? (
              <div
                style={{
                  background: "#fff7e6",
                  border: "1px solid #f0c97c",
                  borderRadius: 10,
                  padding: "12px 14px",
                  marginTop: 16,
                  color: "#7a4f00",
                  textAlign: "left",
                }}
              >
                <strong>💵 Cash on Delivery</strong>
                <div className="small mt-1">
                  Please keep <strong>₹{formatINR(order.grandTotal)}</strong>{" "}
                  ready in cash for the courier.
                </div>
              </div>
            ) : null}

            <div className="order-success-summary">
              <h3>Order summary</h3>
              <ul>
                {order.items.map((it, i) => (
                  <li key={i}>
                    <span>
                      <strong>{it.productName ?? "Product"}</strong>
                      {it.productSize ? `, ${it.productSize}` : ""} × {it.quantity ?? 1}
                    </span>
                    <span>
                      ₹{formatINR((it.price ?? 0) * (it.quantity ?? 1))}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="d-flex justify-content-between mt-3 small text-muted">
                <span>Subtotal</span>
                <span>₹{formatINR(order.subtotal)}</span>
              </div>

              {order.discountAmount > 0 ? (
                <div
                  className="d-flex justify-content-between small"
                  style={{ color: "#2c8b3d" }}
                >
                  <span>
                    Discount{" "}
                    {order.couponCode ? `(${order.couponCode})` : ""}
                  </span>
                  <span>− ₹{formatINR(order.discountAmount)}</span>
                </div>
              ) : null}

              {order.shippingFee > 0 ? (
                <div className="d-flex justify-content-between small text-muted">
                  <span>Shipping</span>
                  <span>₹{formatINR(order.shippingFee)}</span>
                </div>
              ) : null}

              {order.codFee > 0 ? (
                <div className="d-flex justify-content-between small text-muted">
                  <span>COD handling fee</span>
                  <span>₹{formatINR(order.codFee)}</span>
                </div>
              ) : null}

              <div className="d-flex justify-content-between mt-3">
                <strong>{isCod ? "Pay on delivery" : "Grand total"}</strong>
                <strong>₹{formatINR(order.grandTotal)}</strong>
              </div>

              {order.shipping?.awbCode ? (
                <div
                  className="mt-3 small"
                  style={{
                    background: "#fdf7ef",
                    borderRadius: 8,
                    padding: "8px 12px",
                  }}
                >
                  <strong>Tracking:</strong> {order.shipping.awbCode}
                  {" — "}
                  <Link href={`/track/${order.shipping.awbCode}`}>
                    Track shipment
                  </Link>
                </div>
              ) : null}

              {order.shipping && (
                <div className="mt-4 text-start small">
                  <h3>Shipping to</h3>
                  <div>
                    {order.shipping.firstName} {order.shipping.lastName ?? ""}
                  </div>
                  <div>
                    {[
                      order.shipping.apartment,
                      order.shipping.address,
                      order.shipping.city,
                      order.shipping.state,
                      order.shipping.pincode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                  <div>{order.shipping.phone}</div>
                  <div>{order.shipping.email}</div>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="text-muted my-4">
            We couldn&apos;t find the details of your order. If your payment
            was successful you&apos;ll receive an email shortly.
          </p>
        )}

        <div className="order-success-actions">
          <Link href="/products" className="btn-primary-themed">
            Continue shopping
          </Link>
          <Link href="/" className="btn-secondary-themed">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
