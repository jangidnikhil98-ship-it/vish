import type { Metadata } from "next";
import Link from "next/link";

import { readListParams } from "@/lib/admin-pagination";
import { listAdminShiprocketOrders } from "@/lib/queries/admin/orders";

import { AdminListShell } from "../_components/AdminListShell";
import { AdminPageHeader } from "../_components/AdminPageHeader";
import { FlashMessage } from "../_components/FlashMessage";
import { PushToShiprocketButton } from "../orders/[id]/PushToShiprocketButton";

export const metadata: Metadata = { title: "Shiprocket | Admin" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    keyword?: string;
    page?: string;
    success?: string;
    error?: string;
  }>;
}

function inr(value: string | null): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "0.00";
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const SHIPROCKET_BADGE: Record<string, string> = {
  ready: "badge-warning",
  pushed: "badge-info",
  shipped: "badge-success",
  blocked: "badge-danger",
};

export default async function AdminShiprocketPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { page, perPage, keyword } = readListParams(sp);
  const result = await listAdminShiprocketOrders({ page, perPage, keyword });

  return (
    <>
      <AdminPageHeader title="Shiprocket" crumbs={[{ label: "Shiprocket" }]} />
      <FlashMessage success={sp.success} error={sp.error} />

      <AdminListShell
        basePath="/admin/shiprocket"
        searchPlaceholder="Search order, customer, phone, pincode or AWB"
        keyword={keyword}
        page={result.page}
        totalPages={result.totalPages}
      >
        <table className="table userTable">
          <thead>
            <tr className="border-bottom-primary">
              <th>S.No</th>
              <th>Order</th>
              <th>Customer</th>
              <th>Ship To</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Shiprocket</th>
              <th>Action</th>
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
              result.rows.map((order, i) => {
                const prepaidNeedsPayment =
                  order.payment_method !== "cod" &&
                  order.payment_status !== "paid";
                const blocked =
                  order.status === "cancelled" ||
                  prepaidNeedsPayment ||
                  !order.is_address_ready;
                const srState = order.awb_code
                  ? "shipped"
                  : order.shiprocket_order_id
                    ? "pushed"
                    : blocked
                      ? "blocked"
                      : "ready";

                return (
                  <tr key={order.id} className="border-bottom-secondary">
                    <th scope="row">
                      {(result.page - 1) * result.perPage + i + 1}
                    </th>
                    <td>
                      <strong>{order.order_number}</strong>
                      <div className="small text-muted">
                        {order.created_at
                          ? new Date(order.created_at).toLocaleString()
                          : "No date"}
                      </div>
                    </td>
                    <td>
                      {order.shipping_name ?? order.buyer_name ?? "Guest"}
                      {order.shipping_phone ? (
                        <div className="small text-muted">
                          {order.shipping_phone}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      {order.shipping_city || order.shipping_state ? (
                        <>
                          {order.shipping_city}
                          {order.shipping_city && order.shipping_state
                            ? ", "
                            : ""}
                          {order.shipping_state}
                        </>
                      ) : (
                        "Missing"
                      )}
                      <div className="small text-muted">
                        PIN {order.shipping_pincode ?? "missing"}
                      </div>
                    </td>
                    <td>Rs. {inr(order.grand_total)}</td>
                    <td>
                      <span
                        className={
                          "badge rounded-pill p-2 " +
                          (order.payment_method === "cod"
                            ? "badge-warning"
                            : "badge-success")
                        }
                      >
                        {order.payment_method === "cod" ? "COD" : "ONLINE"}
                      </span>
                      <div className="small text-muted mt-1">
                        {order.payment_status}
                      </div>
                    </td>
                    <td>
                      <span
                        className={
                          "badge rounded-pill p-2 " +
                          (SHIPROCKET_BADGE[srState] ?? "badge-secondary")
                        }
                      >
                        {srState}
                      </span>
                      {order.shiprocket_order_id ? (
                        <div className="small mt-1">
                          SR: <code>{order.shiprocket_order_id}</code>
                        </div>
                      ) : null}
                      {order.awb_code ? (
                        <div className="small">
                          AWB: <code>{order.awb_code}</code>
                          {order.tracking_url ? (
                            <>
                              {" "}
                              <a
                                href={order.tracking_url}
                                target="_blank"
                                rel="noreferrer noopener"
                              >
                                Track
                              </a>
                            </>
                          ) : null}
                        </div>
                      ) : null}
                      {order.tracking_status ? (
                        <div className="small text-muted">
                          {order.tracking_status}
                        </div>
                      ) : null}
                      {!order.is_address_ready ? (
                        <div className="small text-danger">
                          Address incomplete
                        </div>
                      ) : null}
                    </td>
                    <td className="jsgrid-cell jsgrid-control-field jsgrid-align-center">
                      <div className="d-flex flex-column gap-2">
                        <PushToShiprocketButton
                          orderId={order.id}
                          status={order.status}
                          paymentMethod={order.payment_method}
                          paymentStatus={order.payment_status}
                          shiprocketOrderId={order.shiprocket_order_id}
                          awbCode={order.awb_code}
                          helperText={false}
                          fullWidth={false}
                        />
                        <Link
                          className="btn btn-pill btn-info btn-air-info btn-sm"
                          href={`/admin/orders/${order.id}`}
                        >
                          View Order
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </AdminListShell>
    </>
  );
}
