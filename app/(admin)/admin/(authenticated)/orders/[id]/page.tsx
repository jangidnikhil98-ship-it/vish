import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAdminOrderById } from "@/lib/queries/admin/orders";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { FlashMessage } from "../../_components/FlashMessage";
import { OrderStatusForm } from "./OrderStatusForm";
import { MarkPaidButton } from "./MarkPaidButton";
import { PushToShiprocketButton } from "./PushToShiprocketButton";

export const metadata: Metadata = { title: "Order Details | Admin" };
export const dynamic = "force-dynamic";

function inr(value: string | number | null): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "0.00";
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function resolveCustomizationImage(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return path;
  return `/storage/${path}`;
}

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}

export default async function AdminOrderViewPage({
  params,
  searchParams,
}: Props) {
  const [{ id: idStr }, sp] = await Promise.all([params, searchParams]);
  const id = Number.parseInt(idStr, 10);
  if (!Number.isFinite(id)) notFound();

  const order = await getAdminOrderById(id);
  if (!order) notFound();

  return (
    <>
      <AdminPageHeader
        title="Order Details"
        crumbs={[
          { label: "Orders", href: "/admin/orders" },
          { label: order.order_number },
        ]}
      />
      <FlashMessage success={sp.success} error={sp.error} />

      <div className="container-fluid">
        <div className="row">
          <div className="col-md-8">
            <div className="card">
              <div className="card-header pb-0">
                <h4>
                  Order #{order.order_number}
                  <span className="badge rounded-pill badge-info p-2 ms-2">
                    {order.status}
                  </span>
                  <span className="badge rounded-pill badge-secondary p-2 ms-2">
                    {order.payment_status}
                  </span>
                  <span
                    className={`badge rounded-pill p-2 ms-2 ${
                      order.payment_method === "cod"
                        ? "badge-warning"
                        : "badge-success"
                    }`}
                  >
                    {order.payment_method === "cod"
                      ? "💵 COD"
                      : "💳 ONLINE"}
                  </span>
                </h4>
              </div>
              <div className="card-body">
                <div className="table-responsive custom-scrollbar">
                  <table className="table">
                    <thead>
                      <tr className="border-bottom-primary">
                        <th>Product</th>
                        <th>Size</th>
                        <th>Variation</th>
                        <th>Qty</th>
                        <th>Unit Price (₹)</th>
                        <th>Line Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center" }}>
                            No items recorded for this order.
                          </td>
                        </tr>
                      ) : (
                        order.items.map((item) => {
                          const unit = Number(item.price ?? 0);
                          const qty = Number(item.quantity ?? 0);
                          const total = unit * qty;
                          return (
                            <tr
                              key={item.id}
                              className="border-bottom-secondary"
                            >
                              <td>
                                <div>
                                  <strong>{item.product_name ?? "—"}</strong>
                                  {item.front_text ? (
                                    <div className="small text-muted">
                                      Front: {item.front_text}
                                    </div>
                                  ) : null}
                                  {item.back_text ? (
                                    <div className="small text-muted">
                                      Back: {item.back_text}
                                    </div>
                                  ) : null}
                                  {item.front_image || item.back_image ? (
                                    <div className="mt-2">
                                      <div className="small fw-semibold mb-1">
                                        Customization
                                      </div>

                                      {item.front_image ? (
                                        <div className="mb-2">
                                          <div className="small text-muted">
                                            Front Image
                                          </div>
                                          <div className="d-flex align-items-center gap-2 flex-wrap">
                                            <a
                                              href={resolveCustomizationImage(item.front_image) ?? "#"}
                                              target="_blank"
                                              rel="noreferrer noopener"
                                            >
                                              <img
                                                src={resolveCustomizationImage(item.front_image) ?? ""}
                                                alt={`${item.product_name ?? "Product"} front customization`}
                                                style={{
                                                  width: 64,
                                                  height: 64,
                                                  objectFit: "cover",
                                                  borderRadius: 6,
                                                  border: "1px solid #ddd",
                                                }}
                                              />
                                            </a>
                                            <a
                                              href={resolveCustomizationImage(item.front_image) ?? "#"}
                                              download
                                              className="btn btn-outline-primary btn-xs"
                                            >
                                              Download Front
                                            </a>
                                          </div>
                                        </div>
                                      ) : null}

                                      {item.back_image ? (
                                        <div>
                                          <div className="small text-muted">
                                            Back Image
                                          </div>
                                          <div className="d-flex align-items-center gap-2 flex-wrap">
                                            <a
                                              href={resolveCustomizationImage(item.back_image) ?? "#"}
                                              target="_blank"
                                              rel="noreferrer noopener"
                                            >
                                              <img
                                                src={resolveCustomizationImage(item.back_image) ?? ""}
                                                alt={`${item.product_name ?? "Product"} back customization`}
                                                style={{
                                                  width: 64,
                                                  height: 64,
                                                  objectFit: "cover",
                                                  borderRadius: 6,
                                                  border: "1px solid #ddd",
                                                }}
                                              />
                                            </a>
                                            <a
                                              href={resolveCustomizationImage(item.back_image) ?? "#"}
                                              download
                                              className="btn btn-outline-primary btn-xs"
                                            >
                                              Download Back
                                            </a>
                                          </div>
                                        </div>
                                      ) : null}
                                    </div>
                                  ) : null}
                                </div>
                              </td>
                              <td>{item.product_size ?? "—"}</td>
                              <td>{item.variation_option ?? "—"}</td>
                              <td>{qty}</td>
                              <td>
                                ₹{" "}
                                {unit.toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                              <td>
                                ₹{" "}
                                {total.toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={5} style={{ textAlign: "right" }}>
                          Subtotal
                        </td>
                        <td>₹ {inr(order.subtotal)}</td>
                      </tr>
                      {Number(order.discount_amount) > 0 ? (
                        <tr style={{ color: "#2c8b3d" }}>
                          <td colSpan={5} style={{ textAlign: "right" }}>
                            Discount
                            {order.coupon_code ? ` (${order.coupon_code})` : ""}
                          </td>
                          <td>− ₹ {inr(order.discount_amount)}</td>
                        </tr>
                      ) : null}
                      {Number(order.shipping_fee) > 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: "right" }}>
                            Shipping
                          </td>
                          <td>₹ {inr(order.shipping_fee)}</td>
                        </tr>
                      ) : null}
                      {Number(order.cod_fee) > 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: "right" }}>
                            COD handling fee
                          </td>
                          <td>₹ {inr(order.cod_fee)}</td>
                        </tr>
                      ) : null}
                      <tr>
                        <td colSpan={5} style={{ textAlign: "right" }}>
                          <strong>Grand Total</strong>
                        </td>
                        <td>
                          <strong>₹ {inr(order.grand_total)}</strong>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card">
              <div className="card-header pb-0">
                <h5>Order Status</h5>
              </div>
              <div className="card-body">
                <OrderStatusForm
                  orderId={order.id}
                  current={order.status}
                />
              </div>
            </div>

            {order.payment_method === "cod" ? (
              <div className="card">
                <div className="card-header pb-0">
                  <h5>Cash on Delivery</h5>
                </div>
                <div className="card-body">
                  <MarkPaidButton
                    orderId={order.id}
                    paymentStatus={order.payment_status}
                  />
                </div>
              </div>
            ) : null}

            <div className="card">
              <div className="card-header pb-0">
                <h5>Shipment (Shiprocket)</h5>
              </div>
              <div className="card-body">
                {order.shipping?.shiprocket_order_id ||
                order.shipping?.awb_code ? (
                  <ul className="list-unstyled mb-3 small">
                    {order.shipping.shiprocket_order_id ? (
                      <li>
                        <strong>SR Order:</strong>{" "}
                        <code>{order.shipping.shiprocket_order_id}</code>
                      </li>
                    ) : null}
                    {order.shipping.shiprocket_shipment_id ? (
                      <li>
                        <strong>Shipment:</strong>{" "}
                        <code>{order.shipping.shiprocket_shipment_id}</code>
                      </li>
                    ) : null}
                    {order.shipping.awb_code ? (
                      <li>
                        <strong>AWB:</strong>{" "}
                        <code>{order.shipping.awb_code}</code>
                        {order.shipping.tracking_url ? (
                          <>
                            {" "}
                            ·{" "}
                            <a
                              href={order.shipping.tracking_url}
                              target="_blank"
                              rel="noreferrer noopener"
                            >
                              Track
                            </a>
                          </>
                        ) : null}
                      </li>
                    ) : null}
                    {order.shipping.tracking_status ? (
                      <li>
                        <strong>Status:</strong>{" "}
                        {order.shipping.tracking_status}
                      </li>
                    ) : null}
                  </ul>
                ) : (
                  <p className="text-muted small mb-3">
                    This order is not in Shiprocket yet. Click below when
                    the parcel is packed and ready to ship.
                  </p>
                )}
                <PushToShiprocketButton
                  orderId={order.id}
                  status={order.status}
                  paymentMethod={order.payment_method}
                  paymentStatus={order.payment_status}
                  shiprocketOrderId={
                    order.shipping?.shiprocket_order_id ?? null
                  }
                  awbCode={order.shipping?.awb_code ?? null}
                />
              </div>
            </div>

            <div className="card">
              <div className="card-header pb-0">
                <h5>Buyer</h5>
              </div>
              <div className="card-body">
                {order.buyer ? (
                  <>
                    <p className="mb-1">
                      <strong>
                        {order.buyer.first_name} {order.buyer.last_name}
                      </strong>
                    </p>
                    <p className="mb-1">{order.buyer.email}</p>
                    <p className="mb-0">{order.buyer.phone ?? "—"}</p>
                  </>
                ) : (
                  <p className="mb-0 text-muted">Guest checkout</p>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header pb-0">
                <h5>Shipping Address</h5>
              </div>
              <div className="card-body">
                {order.shipping ? (
                  <address className="mb-0">
                    <strong>
                      {order.shipping.first_name} {order.shipping.last_name}
                    </strong>
                    <br />
                    {order.shipping.address ? (
                      <>
                        {order.shipping.address}
                        <br />
                      </>
                    ) : null}
                    {order.shipping.apartment ? (
                      <>
                        {order.shipping.apartment}
                        <br />
                      </>
                    ) : null}
                    {order.shipping.city ? `${order.shipping.city}, ` : null}
                    {order.shipping.state} {order.shipping.pincode}
                    <br />
                    {order.shipping.phone}
                    <br />
                    {order.shipping.email}
                  </address>
                ) : (
                  <p className="mb-0 text-muted">No shipping address.</p>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header pb-0">
                <h5>Payment</h5>
              </div>
              <div className="card-body">
                {order.payment ? (
                  <ul className="list-unstyled mb-0">
                    <li>
                      <strong>Method:</strong>{" "}
                      {order.payment.method ?? "Razorpay"}
                    </li>
                    <li>
                      <strong>Status:</strong> {order.payment.status ?? "—"}
                    </li>
                    {order.payment.razorpay_order_id ? (
                      <li>
                        <strong>Razorpay Order:</strong>{" "}
                        <code>{order.payment.razorpay_order_id}</code>
                      </li>
                    ) : null}
                    {order.payment.razorpay_payment_id ? (
                      <li>
                        <strong>Razorpay Payment:</strong>{" "}
                        <code>{order.payment.razorpay_payment_id}</code>
                      </li>
                    ) : null}
                  </ul>
                ) : (
                  <p className="mb-0 text-muted">No payment recorded.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
