import Link from "next/link";
import { readSession } from "@/lib/auth";
import { listUserOrders } from "@/lib/queries/orders";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

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

export default async function DashboardOrdersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const session = await readSession();
  if (!session) return null;

  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const result = await listUserOrders({
    userId: session.sub,
    page,
    perPage: 10,
  });

  return (
    <div className="dashboard-card">
      <div className="dashboard-card-header">
        <h2>My Orders</h2>
        <span className="text-muted small">
          {result.total === 0
            ? "0 orders"
            : `${result.total} order${result.total === 1 ? "" : "s"}`}
        </span>
      </div>

      {result.data.length === 0 ? (
        <div className="dashboard-empty">
          <i className="fa-solid fa-bag-shopping" aria-hidden="true" />
          <p>You haven&apos;t placed any orders yet.</p>
          <Link href="/products" className="btn-primary-themed">
            Start shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {result.data.map((o) => (
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
                      <span className={`dashboard-pill ${statusClass(o.status)}`}>
                        {STATUS_LABEL[o.status] ?? o.status}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/dashboard/orders/${encodeURIComponent(o.orderNumber)}`}
                        className="dashboard-link"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.totalPages > 1 && (
            <Pagination page={result.page} totalPages={result.totalPages} />
          )}
        </>
      )}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const buildHref = (p: number) =>
    p <= 1 ? "/dashboard/orders" : `/dashboard/orders?page=${p}`;

  return (
    <nav className="dashboard-pagination" aria-label="Orders pagination">
      <Link
        href={buildHref(Math.max(1, page - 1))}
        className={`dashboard-page-btn ${page === 1 ? "is-disabled" : ""}`}
        aria-label="Previous page"
      >
        <i className="fa-solid fa-chevron-left" /> Prev
      </Link>
      <span className="dashboard-page-info">
        Page {page} of {totalPages}
      </span>
      <Link
        href={buildHref(Math.min(totalPages, page + 1))}
        className={`dashboard-page-btn ${page === totalPages ? "is-disabled" : ""}`}
        aria-label="Next page"
      >
        Next <i className="fa-solid fa-chevron-right" />
      </Link>
    </nav>
  );
}
