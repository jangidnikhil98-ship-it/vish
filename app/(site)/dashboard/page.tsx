import Link from "next/link";
import { readSession } from "@/lib/auth";
import {
  getUserOrderStats,
  listUserOrders,
  type UserOrderListItem,
} from "@/lib/queries/orders";

export const dynamic = "force-dynamic";

const formatINR = (n: number): string =>
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(n);

const formatDate = (d: Date | null): string => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", {
    dateStyle: "medium",
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

export default async function DashboardOverviewPage() {
  const session = await readSession();
  if (!session) return null; // layout already redirected

  const [stats, recent] = await Promise.all([
    getUserOrderStats(session.sub),
    listUserOrders({ userId: session.sub, page: 1, perPage: 5 }),
  ]);

  return (
    <div>
      <div className="dashboard-stats">
        <div className="dashboard-stat-card">
          <span className="dashboard-stat-icon" aria-hidden="true">
            <i className="fa-solid fa-box" />
          </span>
          <div>
            <strong>{stats.totalOrders}</strong>
            <span className="text-muted small">Total orders</span>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <span className="dashboard-stat-icon stat-success" aria-hidden="true">
            <i className="fa-solid fa-circle-check" />
          </span>
          <div>
            <strong>{stats.paidOrders}</strong>
            <span className="text-muted small">Paid</span>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <span className="dashboard-stat-icon stat-warning" aria-hidden="true">
            <i className="fa-solid fa-clock" />
          </span>
          <div>
            <strong>{stats.pendingOrders}</strong>
            <span className="text-muted small">Pending</span>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <span className="dashboard-stat-icon stat-info" aria-hidden="true">
            <i className="fa-solid fa-indian-rupee-sign" />
          </span>
          <div>
            <strong>₹{formatINR(stats.totalSpent)}</strong>
            <span className="text-muted small">Lifetime spend</span>
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <h2>Recent orders</h2>
          {recent.total > 0 && (
            <Link href="/dashboard/orders" className="dashboard-link">
              View all <i className="fa-solid fa-arrow-right-long" />
            </Link>
          )}
        </div>

        {recent.data.length === 0 ? (
          <div className="dashboard-empty">
            <i className="fa-solid fa-bag-shopping" aria-hidden="true" />
            <p>You haven&apos;t placed any orders yet.</p>
            <Link href="/products" className="btn-primary-themed">
              Start shopping
            </Link>
          </div>
        ) : (
          <RecentOrdersTable rows={recent.data} />
        )}
      </div>
    </div>
  );
}

function RecentOrdersTable({ rows }: { rows: UserOrderListItem[] }) {
  return (
    <div className="dashboard-table-wrap">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Date</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.id}>
              <td>
                <Link
                  href={`/dashboard/orders/${encodeURIComponent(o.orderNumber)}`}
                  className="dashboard-link"
                >
                  {o.orderNumber}
                </Link>
              </td>
              <td>{formatDate(o.createdAt)}</td>
              <td>{o.itemCount}</td>
              <td>₹{formatINR(o.grandTotal)}</td>
              <td>
                <span className={`dashboard-pill ${statusClass(o.paymentStatus)}`}>
                  {STATUS_LABEL[o.paymentStatus] ?? o.paymentStatus}
                </span>
              </td>
              <td>
                <Link
                  href={`/dashboard/orders/${encodeURIComponent(o.orderNumber)}`}
                  className="dashboard-link"
                  aria-label={`View order ${o.orderNumber}`}
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
