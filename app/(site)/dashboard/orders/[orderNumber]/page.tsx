import Link from "next/link";
import { notFound } from "next/navigation";
import { readSession } from "@/lib/auth";
import { getUserOrderByNumber } from "@/lib/queries/orders";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ orderNumber: string }>;
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

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
  cancelled: "Cancelled",
  paid: "Paid",
  failed: "Failed",
};

const statusClass = (s: string): string => {
  if (s === "paid" || s === "completed") return "is-success";
  if (s === "failed" || s === "cancelled") return "is-danger";
  if (s === "processing") return "is-info";
  return "is-warning";
};

export default async function DashboardOrderDetailPage({ params }: PageProps) {
  const { orderNumber } = await params;
  const session = await readSession();
  if (!session) return null;

  const order = await getUserOrderByNumber({
    userId: session.sub,
    orderNumber: decodeURIComponent(orderNumber),
  });

  if (!order) notFound();

  return (
    <div>
      <div className="dashboard-breadcrumb">
        <Link href="/dashboard/orders" className="dashboard-link">
          <i className="fa-solid fa-arrow-left-long" /> Back to orders
        </Link>
      </div>

      <div className="dashboard-card">
        <div className="dashboard-card-header dashboard-order-header">
          <div>
            <h2>Order {order.orderNumber}</h2>
            {order.createdAt && (
              <p className="text-muted small">
                Placed on {formatDate(order.createdAt)}
              </p>
            )}
          </div>
          <div className="dashboard-order-status-row">
            <span className={`dashboard-pill ${statusClass(order.paymentStatus)}`}>
              Payment: {STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus}
            </span>
            <span className={`dashboard-pill ${statusClass(order.status)}`}>
              {STATUS_LABEL[order.status] ?? order.status}
            </span>
          </div>
        </div>

        <h3 className="dashboard-section-title">Items</h3>
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Size / Variation</th>
                <th>Gift wrap</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((it, i) => {
                const qty = it.quantity ?? 1;
                const price = it.price ?? 0;
                return (
                  <tr key={i}>
                    <td>
                      <strong>{it.productName ?? "Product"}</strong>
                    </td>
                    <td>
                      {it.productSize ?? "—"}
                      {it.variation ? (
                        <div className="text-muted small">
                          {it.variation.replace("_", " ")}
                        </div>
                      ) : null}
                    </td>
                    <td>{it.giftWrap === "yes" ? "Yes" : "No"}</td>
                    <td>{qty}</td>
                    <td>₹{formatINR(price)}</td>
                    <td>
                      <strong>₹{formatINR(price * qty)}</strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} className="text-end">
                  <strong>Grand total</strong>
                </td>
                <td>
                  <strong>₹{formatINR(order.grandTotal)}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {order.shipping && (
          <>
            <h3 className="dashboard-section-title">Shipping address</h3>
            <div className="dashboard-address-card">
              <strong>
                {order.shipping.firstName} {order.shipping.lastName ?? ""}
              </strong>
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
              {order.shipping.phone && (
                <div>
                  <i className="fa-solid fa-phone fa-xs" /> {order.shipping.phone}
                </div>
              )}
              {order.shipping.email && (
                <div>
                  <i className="fa-solid fa-envelope fa-xs" />{" "}
                  {order.shipping.email}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
