import type { Metadata } from "next";
import Link from "next/link";

import { listAdminOrders } from "@/lib/queries/admin/orders";
import { readListParams } from "@/lib/admin-pagination";

import { AdminListShell } from "../_components/AdminListShell";
import { AdminPageHeader } from "../_components/AdminPageHeader";
import { AdminDeleteButton } from "../_components/AdminDeleteButton";
import { FlashMessage } from "../_components/FlashMessage";

export const metadata: Metadata = { title: "Orders | Admin" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    keyword?: string;
    page?: string;
    success?: string;
    error?: string;
  }>;
}

function inrFromPaise(value: string | null): string {
  // Laravel was storing grand_total in paise (× 100). Mirror that conversion.
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "0.00";
  return (n / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const STATUS_BADGE: Record<string, string> = {
  pending: "badge-warning",
  processing: "badge-info",
  completed: "badge-success",
  cancelled: "badge-danger",
};

const PAYMENT_BADGE: Record<string, string> = {
  pending: "badge-warning",
  paid: "badge-success",
  failed: "badge-danger",
  refunded: "badge-secondary",
};

export default async function AdminOrdersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { page, perPage, keyword } = readListParams(sp);

  const result = await listAdminOrders({ page, perPage, keyword });

  return (
    <>
      <AdminPageHeader title="Orders" crumbs={[{ label: "Orders" }]} />
      <FlashMessage success={sp.success} error={sp.error} />

      <AdminListShell
        basePath="/admin/orders"
        searchPlaceholder="Search by order number or buyer"
        keyword={keyword}
        page={result.page}
        totalPages={result.totalPages}
      >
        <table className="table userTable">
          <thead>
            <tr className="border-bottom-primary">
              <th>S.No</th>
              <th>Order #</th>
              <th>Buyer</th>
              <th>Total (₹)</th>
              <th>Order Status</th>
              <th>Payment</th>
              <th>Placed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.length === 0 ? (
              <tr className="border-bottom-secondary">
                <td colSpan={8} style={{ textAlign: "center" }}>
                  No Records Found
                </td>
              </tr>
            ) : (
              result.rows.map((o, i) => (
                <tr key={o.id} className="border-bottom-secondary">
                  <th scope="row">
                    {(result.page - 1) * result.perPage + i + 1}
                  </th>
                  <td>
                    <strong>{o.order_number}</strong>
                  </td>
                  <td>{o.buyer_name ?? "Guest"}</td>
                  <td>₹ {inrFromPaise(o.grand_total)}</td>
                  <td>
                    <span
                      className={
                        "badge rounded-pill p-2 " +
                        (STATUS_BADGE[o.status] ?? "badge-secondary")
                      }
                    >
                      {o.status}
                    </span>
                  </td>
                  <td>
                    <span
                      className={
                        "badge rounded-pill p-2 " +
                        (PAYMENT_BADGE[o.payment_status] ?? "badge-secondary")
                      }
                    >
                      {o.payment_status}
                    </span>
                  </td>
                  <td>
                    {o.created_at
                      ? new Date(o.created_at).toLocaleString()
                      : "—"}
                  </td>
                  <td className="jsgrid-cell jsgrid-control-field jsgrid-align-center">
                    <Link
                      className="btn btn-pill btn-info btn-air-info btn-sm"
                      href={`/admin/orders/${o.id}`}
                    >
                      View
                    </Link>
                    <AdminDeleteButton
                      endpoint={`/api/admin/orders/${o.id}`}
                      label="Delete"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </AdminListShell>
    </>
  );
}
