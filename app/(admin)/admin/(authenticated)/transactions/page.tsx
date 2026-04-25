import type { Metadata } from "next";
import Link from "next/link";

import { listAdminTransactions } from "@/lib/queries/admin/transactions";
import { readListParams } from "@/lib/admin-pagination";

import { AdminListShell } from "../_components/AdminListShell";
import { AdminPageHeader } from "../_components/AdminPageHeader";
import { FlashMessage } from "../_components/FlashMessage";

export const metadata: Metadata = { title: "Transactions | Admin" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    keyword?: string;
    page?: string;
    success?: string;
    error?: string;
  }>;
}

const STATUS_BADGE: Record<string, string> = {
  created: "badge-warning",
  completed: "badge-success",
  failed: "badge-danger",
};

export default async function AdminTransactionsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { page, perPage, keyword } = readListParams(sp);

  const result = await listAdminTransactions({ page, perPage, keyword });

  return (
    <>
      <AdminPageHeader
        title="Transactions"
        crumbs={[{ label: "Transactions" }]}
      />
      <FlashMessage success={sp.success} error={sp.error} />

      <AdminListShell
        basePath="/admin/transactions"
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
              <th>Amount (₹)</th>
              <th>Method</th>
              <th>Status</th>
              <th>Date</th>
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
              result.rows.map((t, i) => (
                <tr key={t.id} className="border-bottom-secondary">
                  <th scope="row">
                    {(result.page - 1) * result.perPage + i + 1}
                  </th>
                  <td>
                    <strong>{t.order_number ?? "—"}</strong>
                  </td>
                  <td>{t.buyer_name ?? "Guest"}</td>
                  <td>
                    ₹{" "}
                    {Number(t.amount).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td>{t.payment_method}</td>
                  <td>
                    <span
                      className={
                        "badge rounded-pill p-2 " +
                        (STATUS_BADGE[t.status] ?? "badge-secondary")
                      }
                    >
                      {t.status}
                    </span>
                  </td>
                  <td>
                    {t.created_at
                      ? new Date(t.created_at).toLocaleString()
                      : "—"}
                  </td>
                  <td>
                    <Link
                      className="btn btn-pill btn-info btn-air-info btn-sm"
                      href={`/admin/transactions/${t.id}`}
                    >
                      View
                    </Link>
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
