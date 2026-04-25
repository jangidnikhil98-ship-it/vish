import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAdminOrderById } from "@/lib/queries/admin/orders";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { FlashMessage } from "../../_components/FlashMessage";
import { OrderStatusForm } from "./OrderStatusForm";

export const metadata: Metadata = { title: "Order Details | Admin" };
export const dynamic = "force-dynamic";

function inrFromPaise(value: string | null): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "0.00";
  return (n / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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
                          <strong>Grand Total</strong>
                        </td>
                        <td>
                          <strong>₹ {inrFromPaise(order.grand_total)}</strong>
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
