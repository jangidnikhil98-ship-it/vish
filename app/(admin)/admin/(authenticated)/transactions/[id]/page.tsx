import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getAdminTransactionById } from "@/lib/queries/admin/transactions";
import { AdminPageHeader } from "../../_components/AdminPageHeader";

export const metadata: Metadata = { title: "Transaction Details | Admin" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminTransactionViewPage({ params }: Props) {
  const { id: idStr } = await params;
  const id = Number.parseInt(idStr, 10);
  if (!Number.isFinite(id)) notFound();

  const txn = await getAdminTransactionById(id);
  if (!txn) notFound();

  let parsedDetails: unknown = null;
  if (txn.payment_details) {
    try {
      parsedDetails = JSON.parse(txn.payment_details);
    } catch {
      parsedDetails = txn.payment_details;
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Transaction Details"
        crumbs={[
          { label: "Transactions", href: "/admin/transactions" },
          { label: `#${txn.id}` },
        ]}
      />

      <div className="container-fluid">
        <div className="card">
          <div className="card-header pb-0">
            <h4>Transaction #{txn.id}</h4>
          </div>
          <div className="card-body">
            <div className="table-responsive custom-scrollbar">
              <table className="table">
                <tbody>
                  <tr className="border-bottom-secondary">
                    <td>
                      <strong>Order</strong>
                    </td>
                    <td>
                      {txn.order_number ? (
                        <Link href={`/admin/orders/${txn.order_id}`}>
                          {txn.order_number}
                        </Link>
                      ) : (
                        `#${txn.order_id}`
                      )}
                    </td>
                  </tr>
                  <tr className="border-bottom-secondary">
                    <td>
                      <strong>Buyer</strong>
                    </td>
                    <td>{txn.buyer_name ?? "Guest"}</td>
                  </tr>
                  <tr className="border-bottom-secondary">
                    <td>
                      <strong>Amount</strong>
                    </td>
                    <td>
                      ₹{" "}
                      {Number(txn.amount).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                  <tr className="border-bottom-secondary">
                    <td>
                      <strong>Method</strong>
                    </td>
                    <td>{txn.payment_method}</td>
                  </tr>
                  <tr className="border-bottom-secondary">
                    <td>
                      <strong>Status</strong>
                    </td>
                    <td>
                      <span className="badge rounded-pill badge-info p-2">
                        {txn.status}
                      </span>
                    </td>
                  </tr>
                  <tr className="border-bottom-secondary">
                    <td>
                      <strong>Razorpay Order</strong>
                    </td>
                    <td>
                      <code>{txn.razorpay_order_id ?? "—"}</code>
                    </td>
                  </tr>
                  <tr className="border-bottom-secondary">
                    <td>
                      <strong>Razorpay Payment</strong>
                    </td>
                    <td>
                      <code>{txn.razorpay_payment_id ?? "—"}</code>
                    </td>
                  </tr>
                  <tr className="border-bottom-secondary">
                    <td>
                      <strong>Date</strong>
                    </td>
                    <td>
                      {txn.created_at
                        ? new Date(txn.created_at).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {parsedDetails ? (
              <div className="mt-3">
                <h6>Raw Payment Payload</h6>
                <pre
                  style={{
                    background: "#f7f7f7",
                    padding: 12,
                    borderRadius: 6,
                    maxHeight: 400,
                    overflow: "auto",
                  }}
                >
                  {typeof parsedDetails === "string"
                    ? parsedDetails
                    : JSON.stringify(parsedDetails, null, 2)}
                </pre>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
