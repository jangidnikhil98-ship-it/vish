import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { orders, shippingDetails, orderItems } from "@/lib/db/schema";
import "../order/success/success.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Track Order | Vishwakarma Gifts",
  description: "Track your order status and shipment details online.",
  alternates: { canonical: "/track" },
};

interface PageProps {
  searchParams: Promise<{
    orderNumber?: string;
    email?: string;
  }>;
}

const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
};

export default async function TrackOrderPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const orderNumber = (sp.orderNumber ?? "").trim();
  const email = (sp.email ?? "").trim().toLowerCase();

  let orderData = null;
  let itemsData: any[] = [];
  let otherOrders: any[] = [];
  let errorMsg = null;
  let searched = false;

  if (email) {
    searched = true;
    if (orderNumber) {
      // Look up specific order details
      try {
        const [foundOrder] = await db
          .select({
            id: orders.id,
            orderNumber: orders.order_number,
            status: orders.status,
            paymentStatus: orders.payment_status,
            paymentMethod: orders.payment_method,
            grandTotal: orders.grand_total,
            subtotal: orders.subtotal,
            discountAmount: orders.discount_amount,
            shippingFee: orders.shipping_fee,
            codFee: orders.cod_fee,
            couponCode: orders.coupon_code,
            createdAt: orders.created_at,
            shippingEmail: shippingDetails.email,
            shippingPhone: shippingDetails.phone,
            shippingFirstName: shippingDetails.first_name,
            shippingLastName: shippingDetails.last_name,
            shippingAddress: shippingDetails.address,
            shippingApartment: shippingDetails.apartment,
            shippingCity: shippingDetails.city,
            shippingState: shippingDetails.state,
            shippingPincode: shippingDetails.pincode,
            awbCode: shippingDetails.awb_code,
          })
          .from(orders)
          .leftJoin(shippingDetails, eq(shippingDetails.order_id, orders.id))
          .where(eq(orders.order_number, orderNumber))
          .limit(1);

        if (!foundOrder) {
          errorMsg = "We couldn't find an order with that order number.";
        } else {
          const orderEmail = (foundOrder.shippingEmail ?? "").trim().toLowerCase();
          if (orderEmail !== email) {
            errorMsg = "The email address does not match this order number. Please verify your details.";
          } else {
            orderData = foundOrder;
            itemsData = await db
              .select()
              .from(orderItems)
              .where(eq(orderItems.order_id, foundOrder.id))
              .orderBy(orderItems.id);

            // Fetch other orders under this email to construct order history list
            otherOrders = await db
              .select({
                orderNumber: orders.order_number,
                createdAt: orders.created_at,
                grandTotal: orders.grand_total,
                status: orders.status,
              })
              .from(orders)
              .innerJoin(shippingDetails, eq(shippingDetails.order_id, orders.id))
              .where(eq(shippingDetails.email, orderEmail))
              .orderBy(orders.id);
          }
        }
      } catch (err) {
        console.error("[track/page] query error:", err);
        errorMsg = "An error occurred while fetching your order. Please try again later.";
      }
    } else {
      // Look up list of orders associated with the email address (orderNumber left blank)
      try {
        otherOrders = await db
          .select({
            orderNumber: orders.order_number,
            createdAt: orders.created_at,
            grandTotal: orders.grand_total,
            status: orders.status,
          })
          .from(orders)
          .innerJoin(shippingDetails, eq(shippingDetails.order_id, orders.id))
          .where(eq(shippingDetails.email, email))
          .orderBy(orders.id);

        if (otherOrders.length === 0) {
          errorMsg = "We couldn't find any orders associated with that email address.";
        }
      } catch (err) {
        console.error("[track/page] history query error:", err);
        errorMsg = "An error occurred while fetching your history. Please try again later.";
      }
    }
  }

  // Visual status helper
  const getStatusStep = (status: string) => {
    switch (status) {
      case "pending":
        return 1;
      case "processing":
        return 2;
      case "completed":
        return 3;
      default:
        return 1;
    }
  };

  const currentStep = orderData ? getStatusStep(orderData.status) : 1;
  const isCancelled = orderData?.status === "cancelled";

  return (
    <div className="container order-success-wrapper" style={{ minHeight: "65vh" }}>
      <div className="order-success-card" style={{ maxWidth: 840, textAlign: "left" }}>
        
        {/* Page Header */}
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div className="order-success-icon" style={{ background: "#FFFDF9", color: "#3D2B1F" }}>
            <i className="fa-solid fa-orders"></i>
          </div>
          <h1 style={{ fontSize: "1.8rem", color: "#3D2B1F", fontWeight: 700 }}>Track Your Order &amp; History</h1>
          <p className="text-muted">Enter your details to track a specific order, or just your email to see your order history.</p>
        </div>

        {/* Lookup Form (shown when nothing is loaded or there is an error) */}
        {(!orderData && otherOrders.length === 0) && (
          <form method="GET" style={{ background: "#FFFDF9", padding: 24, borderRadius: 12, border: "1px solid rgba(201,168,76,0.2)" }}>
            {errorMsg && (
              <div className="alert alert-danger" style={{ fontSize: "0.9rem", padding: "10px 14px", borderRadius: 8, marginBottom: 18 }}>
                <i className="fa-solid fa-circle-exclamation me-2"></i> {errorMsg}
              </div>
            )}
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-semibold text-muted" htmlFor="orderNumber">Order Number (Optional)</label>
                <input
                  type="text"
                  id="orderNumber"
                  name="orderNumber"
                  placeholder="e.g. ORD-1718000"
                  defaultValue={orderNumber}
                  className="form-control"
                  style={{ borderRadius: 8 }}
                />
                <span className="text-muted small" style={{ fontSize: "0.75rem" }}>Leave blank to lookup your history list.</span>
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold text-muted" htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="e.g. buyer@example.com"
                  required
                  defaultValue={email}
                  className="form-control"
                  style={{ borderRadius: 8 }}
                />
              </div>
              <div className="col-12 mt-4" style={{ textAlign: "center" }}>
                <button type="submit" className="btn-primary-themed" style={{ minWidth: 250, border: "none", cursor: "pointer" }}>
                  View Order Status &amp; History
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Render list of orders when searching by email only (no specific order selected yet) */}
        {!orderData && otherOrders.length > 0 && (
          <div style={{ background: "#FFFDF9", padding: 24, borderRadius: 12, border: "1px solid rgba(201,168,76,0.2)" }}>
            {errorMsg && (
              <div className="alert alert-danger mb-3" style={{ fontSize: "0.9rem" }}>
                {errorMsg}
              </div>
            )}
            <h3 style={{ fontSize: "1.1rem", color: "#3D2B1F", fontWeight: 700, borderBottom: "1px solid rgba(201,168,76,0.2)", paddingBottom: 10, marginBottom: 16 }}>
              <i className="fa-solid fa-clock-rotate-left me-2"></i> Order History for {email}
            </h3>
            <p className="text-muted small mb-4">Click on any order number below to view its tracking details, items list, and live status.</p>

            <div className="row g-3">
              {otherOrders.map((ord, idx) => (
                <div key={idx} className="col-md-6">
                  <div className="card p-3 border h-100" style={{ background: "#fff", borderRadius: 8 }}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <Link
                        href={`/track?orderNumber=${ord.orderNumber}&email=${encodeURIComponent(email)}`}
                        className="fw-bold"
                        style={{ color: "#C9A84C", textDecoration: "underline", fontSize: "1.05rem" }}
                      >
                        {ord.orderNumber}
                      </Link>
                      <span
                        className="badge text-uppercase"
                        style={{
                          fontSize: "0.75rem",
                          background: ord.status === "completed" ? "#e8f5e9" : ord.status === "cancelled" ? "#ffebee" : "#fff8e1",
                          color: ord.status === "completed" ? "#2e7d32" : ord.status === "cancelled" ? "#c62828" : "#f57f17",
                        }}
                      >
                        {ord.status}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-1 text-muted small">
                      <span>
                        Placed on:{" "}
                        {ord.createdAt
                          ? new Date(ord.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })
                          : ""}
                      </span>
                      <strong style={{ color: "#3D2B1F" }}>{formatPrice(ord.grandTotal)}</strong>
                    </div>
                    <div className="mt-3">
                      <Link
                        href={`/track?orderNumber=${ord.orderNumber}&email=${encodeURIComponent(email)}`}
                        className="btn btn-outline-secondary btn-sm w-100"
                        style={{ fontSize: "0.8rem", borderRadius: 6, textAlign: "center" }}
                      >
                        Track Shipment &amp; Details &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center", marginTop: 30 }}>
              <Link href="/track" className="btn-secondary-themed" style={{ padding: "8px 24px", textDecoration: "none" }}>
                Back to Search Form
              </Link>
            </div>
          </div>
        )}

        {/* Specific Order tracking display */}
        {orderData && (
          <div className="row g-4">
            
            {/* Left side: Main Tracking & Details */}
            <div className="col-lg-8">
              {/* Top Order Summary Bar */}
              <div className="d-flex justify-content-between align-items-center flex-wrap p-3 mb-4" style={{ background: "#FFFDF9", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10 }}>
                <div>
                  <div className="small text-muted">Order Number</div>
                  <strong style={{ fontSize: "1.1rem", color: "#3D2B1F" }}>{orderData.orderNumber}</strong>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="small text-muted">Placed on</div>
                  <span className="small fw-semibold">
                    {orderData.createdAt
                      ? new Date(orderData.createdAt).toLocaleDateString("en-IN", {
                          dateStyle: "medium",
                        })
                      : "N/A"}
                  </span>
                </div>
              </div>

              {/* Stepper / Timeline */}
              {!isCancelled ? (
                <div className="my-5 px-3">
                  <div className="position-relative d-flex justify-content-between align-items-center" style={{ zIndex: 1 }}>
                    {/* Background progress bar */}
                    <div
                      className="position-absolute start-0 end-0"
                      style={{
                        height: 4,
                        background: "rgba(201,168,76,0.2)",
                        top: "50%",
                        transform: "translateY(-50%)",
                        zIndex: -1,
                      }}
                    />
                    {/* Filled progress bar */}
                    <div
                      className="position-absolute start-0"
                      style={{
                        height: 4,
                        background: "#3D2B1F",
                        top: "50%",
                        transform: "translateY(-50%)",
                        zIndex: -1,
                        width: currentStep === 1 ? "0%" : currentStep === 2 ? "50%" : "100%",
                        transition: "width 0.4s ease",
                      }}
                    />

                    {/* Step 1: Placed */}
                    <div style={{ textAlign: "center", background: "#fff", padding: "0 8px" }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "#3D2B1F",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 8px",
                          fontSize: "0.9rem",
                        }}
                      >
                        <i className="fa-solid fa-check"></i>
                      </div>
                      <span className="small fw-semibold" style={{ color: "#3D2B1F" }}>Placed</span>
                    </div>

                    {/* Step 2: Processing */}
                    <div style={{ textAlign: "center", background: "#fff", padding: "0 8px" }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: currentStep >= 2 ? "#3D2B1F" : "rgba(201,168,76,0.2)",
                          color: currentStep >= 2 ? "#fff" : "#8c7e73",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 8px",
                          fontSize: "0.9rem",
                        }}
                      >
                        {currentStep > 2 ? (
                          <i className="fa-solid fa-check"></i>
                        ) : (
                          <i className="fa-solid fa-gear"></i>
                        )}
                      </div>
                      <span className="small fw-semibold" style={{ color: currentStep >= 2 ? "#3D2B1F" : "#8c7e73" }}>Processing</span>
                    </div>

                    {/* Step 3: Shipped / Completed */}
                    <div style={{ textAlign: "center", background: "#fff", padding: "0 8px" }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: currentStep >= 3 ? "#2e7d32" : "rgba(201,168,76,0.2)",
                          color: currentStep >= 3 ? "#fff" : "#8c7e73",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 8px",
                          fontSize: "0.9rem",
                        }}
                      >
                        {currentStep >= 3 ? (
                          <i className="fa-solid fa-truck-ramp-box"></i>
                        ) : (
                          <i className="fa-solid fa-truck"></i>
                        )}
                      </div>
                      <span className="small fw-semibold" style={{ color: currentStep >= 3 ? "#2e7d32" : "#8c7e73" }}>Shipped</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="alert alert-danger my-4 p-3 d-flex align-items-center gap-3" style={{ borderRadius: 10 }}>
                  <i className="fa-solid fa-circle-xmark" style={{ fontSize: "1.8rem" }}></i>
                  <div>
                    <h5 className="mb-1 fw-bold">Order Cancelled</h5>
                    <p className="mb-0 small text-danger">This order was cancelled. If you have questions or need a refund, please contact customer support.</p>
                  </div>
                </div>
              )}

              {/* Courier Shipment details (if shipped) */}
              {orderData.awbCode && (
                <div className="mb-4 p-3 d-flex align-items-center justify-content-between flex-wrap gap-2" style={{ background: "#eef7ee", border: "1px solid #c2e0c2", borderRadius: 10, color: "#1b5e20" }}>
                  <div>
                    <strong className="d-block">🚀 Shipped via Courier</strong>
                    <span className="small text-success">AWB Number: {orderData.awbCode}</span>
                  </div>
                  <Link
                    href={`/track/${orderData.awbCode}?email=${encodeURIComponent(email)}`}
                    className="btn-primary-themed"
                    style={{ background: "#2e7d32", padding: "8px 16px", fontSize: "0.85rem", textDecoration: "none" }}
                  >
                    Live Delivery Timeline
                  </Link>
                </div>
              )}

              {/* Details table */}
              <div className="order-success-summary" style={{ paddingBottom: 10, borderBottom: "none" }}>
                <h3 style={{ borderBottom: "1px solid rgba(201,168,76,0.2)", paddingBottom: 8, marginBottom: 12 }}>Items Summary</h3>
                <ul>
                  {itemsData.map((item, idx) => (
                    <li key={idx}>
                      <span>
                        <strong>{item.productName ?? "Product"}</strong>
                        {item.productSize ? `, ${item.productSize}` : ""}
                        {" \u00d7 "}
                        {item.quantity ?? 1}
                      </span>
                      <span>{formatPrice((item.price ?? 0) * (item.quantity ?? 1))}</span>
                    </li>
                  ))}
                </ul>

                <div className="d-flex justify-content-between mt-3 small text-muted">
                  <span>Subtotal</span>
                  <span>{formatPrice(orderData.subtotal)}</span>
                </div>

                {orderData.discountAmount > 0 && (
                  <div className="d-flex justify-content-between small" style={{ color: "#2c8b3d" }}>
                    <span>Discount {orderData.couponCode ? `(${orderData.couponCode})` : ""}</span>
                    <span>&minus; {formatPrice(orderData.discountAmount)}</span>
                  </div>
                )}

                {orderData.shippingFee > 0 && (
                  <div className="d-flex justify-content-between small text-muted">
                    <span>Shipping Fee</span>
                    <span>{formatPrice(orderData.shippingFee)}</span>
                  </div>
                )}

                {orderData.codFee > 0 && (
                  <div className="d-flex justify-content-between small text-muted">
                    <span>COD Handling Fee</span>
                    <span>{formatPrice(orderData.codFee)}</span>
                  </div>
                )}

                <div className="d-flex justify-content-between mt-3 pt-2" style={{ borderTop: "1px solid rgba(201,168,76,0.2)" }}>
                  <strong>Grand Total</strong>
                  <strong style={{ fontSize: "1.1rem", color: "#3D2B1F" }}>{formatPrice(orderData.grandTotal)}</strong>
                </div>
              </div>

              {/* Shipping Address details */}
              <div className="mt-4 p-3" style={{ background: "#FFFDF9", borderRadius: 10, border: "1px solid rgba(201,168,76,0.2)" }}>
                <h3 style={{ fontSize: "0.95rem", color: "#3D2B1F", fontWeight: 700, marginBottom: 8 }}>Delivery Address</h3>
                <div className="small" style={{ lineHeight: 1.5 }}>
                  <div><strong>{orderData.shippingFirstName} {orderData.shippingLastName ?? ""}</strong></div>
                  <div>{orderData.shippingApartment ? `${orderData.shippingApartment}, ` : ""}{orderData.shippingAddress}</div>
                  <div>{orderData.shippingCity}, {orderData.shippingState} - {orderData.shippingPincode}</div>
                  <div className="mt-2 text-muted"><i className="fa-solid fa-phone me-1"></i> {orderData.shippingPhone}</div>
                </div>
              </div>
            </div>

            {/* Right side: Guest Order History Sidebar */}
            <div className="col-lg-4">
              <div className="p-3" style={{ background: "#FFFDF9", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10, position: "sticky", top: 100 }}>
                <h3 style={{ fontSize: "1rem", color: "#3D2B1F", fontWeight: 700, borderBottom: "1px solid rgba(201,168,76,0.2)", paddingBottom: 10, marginBottom: 12 }}>
                  <i className="fa-solid fa-clock-rotate-left me-2"></i> Order History
                </h3>
                <p className="text-muted small">All orders placed with the email <strong>{email}</strong>:</p>

                {otherOrders.length > 0 ? (
                  <div style={{ maxHeight: "400px", overflowY: "auto", paddingRight: 5 }}>
                    {otherOrders.map((ord, oIdx) => {
                      const isCurrent = ord.orderNumber === orderData.orderNumber;
                      return (
                        <div
                          key={oIdx}
                          style={{
                            background: isCurrent ? "#fff" : "transparent",
                            border: isCurrent ? "1px solid #3D2B1F" : "1px solid transparent",
                            borderRadius: 8,
                            padding: "8px 12px",
                            marginBottom: 8,
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            {isCurrent ? (
                              <strong className="small" style={{ color: "#3D2B1F" }}>
                                {ord.orderNumber}
                              </strong>
                            ) : (
                              <Link
                                href={`/track?orderNumber=${ord.orderNumber}&email=${encodeURIComponent(email)}`}
                                className="small fw-semibold"
                                style={{ color: "#C9A84C", textDecoration: "underline" }}
                              >
                                {ord.orderNumber}
                              </Link>
                            )}
                            <span
                              className="badge text-uppercase"
                              style={{
                                fontSize: "0.7rem",
                                background: ord.status === "completed" ? "#e8f5e9" : ord.status === "cancelled" ? "#ffebee" : "#fff8e1",
                                color: ord.status === "completed" ? "#2e7d32" : ord.status === "cancelled" ? "#c62828" : "#f57f17",
                              }}
                            >
                              {ord.status}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mt-1 text-muted" style={{ fontSize: "0.75rem" }}>
                            <span>
                              {ord.createdAt
                                ? new Date(ord.createdAt).toLocaleDateString("en-IN", { dateStyle: "short" })
                                : ""}
                            </span>
                            <strong>{formatPrice(ord.grandTotal)}</strong>
                          </div>
                          {isCurrent && (
                            <div className="mt-1" style={{ fontSize: "0.7rem", color: "#3D2B1F", fontWeight: 600 }}>
                              <i className="fa-solid fa-eye me-1"></i> Currently Viewing
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted small">No other orders found.</p>
                )}
              </div>
            </div>

            {/* Track another button */}
            <div className="col-12" style={{ textAlign: "center", marginTop: 20 }}>
              <Link href="/track" className="btn-secondary-themed" style={{ padding: "8px 24px", textDecoration: "none" }}>
                Track Another Order
              </Link>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="order-success-actions mt-4 pt-3" style={{ borderTop: "1px dashed rgba(201,168,76,0.2)" }}>
          <Link href="/products" className="btn-primary-themed" style={{ textDecoration: "none" }}>
            Continue Shopping
          </Link>
          <Link href="/" className="btn-secondary-themed" style={{ textDecoration: "none" }}>
            Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
}
