import type { Metadata } from "next";
import Link from "next/link";

import { listAdminCoupons } from "@/lib/queries/admin/coupons";
import { readListParams } from "@/lib/admin-pagination";

import { AdminListShell } from "../_components/AdminListShell";
import { AdminPageHeader } from "../_components/AdminPageHeader";
import { AdminStatusToggle } from "../_components/AdminStatusToggle";
import { AdminDeleteButton } from "../_components/AdminDeleteButton";
import { FlashMessage } from "../_components/FlashMessage";

export const metadata: Metadata = { title: "Coupons | Admin" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    keyword?: string;
    page?: string;
    success?: string;
    error?: string;
  }>;
}

function describeCoupon(c: {
  type: "percent" | "free_shipping";
  value: string;
  max_discount_amount: string | null;
}): string {
  if (c.type === "free_shipping") return "Free shipping";
  const pct = Number(c.value);
  const cap = c.max_discount_amount ? Number(c.max_discount_amount) : null;
  return cap
    ? `${pct.toFixed(0)}% off (max ₹${cap.toFixed(0)})`
    : `${pct.toFixed(0)}% off`;
}

function formatValidity(c: {
  valid_from: Date | null;
  valid_until: Date | null;
}): string {
  if (!c.valid_from && !c.valid_until) return "Always";
  const fmt = (d: Date) => new Date(d).toLocaleDateString();
  if (c.valid_from && c.valid_until)
    return `${fmt(c.valid_from)} → ${fmt(c.valid_until)}`;
  if (c.valid_until) return `until ${fmt(c.valid_until)}`;
  return `from ${fmt(c.valid_from!)}`;
}

export default async function AdminCouponsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { page, perPage, keyword } = readListParams(sp);

  const result = await listAdminCoupons({ page, perPage, keyword });

  return (
    <>
      <AdminPageHeader title="Coupons" crumbs={[{ label: "Coupons" }]} />
      <FlashMessage success={sp.success} error={sp.error} />

      <AdminListShell
        basePath="/admin/coupons"
        searchPlaceholder="Search by code or description"
        keyword={keyword}
        page={result.page}
        totalPages={result.totalPages}
        createButton={{
          href: "/admin/coupons/new",
          label: "+ Create Coupon",
        }}
      >
        <table className="table userTable">
          <thead>
            <tr className="border-bottom-primary">
              <th>S.No</th>
              <th>Code</th>
              <th>Discount</th>
              <th>Min Order</th>
              <th>Used / Limit</th>
              <th>Valid</th>
              <th>Status</th>
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
              result.rows.map((c, i) => (
                <tr key={c.id} className="border-bottom-secondary">
                  <th scope="row">
                    {(result.page - 1) * result.perPage + i + 1}
                  </th>
                  <td>
                    <strong style={{ letterSpacing: 1 }}>{c.code}</strong>
                    {c.description ? (
                      <div className="small text-muted">{c.description}</div>
                    ) : null}
                  </td>
                  <td>{describeCoupon(c)}</td>
                  <td>
                    {Number(c.min_order_amount) > 0
                      ? `₹${Number(c.min_order_amount).toFixed(0)}`
                      : "—"}
                  </td>
                  <td>
                    {c.used_count}
                    {" / "}
                    {c.usage_limit ?? "∞"}
                  </td>
                  <td>{formatValidity(c)}</td>
                  <td>
                    <AdminStatusToggle
                      endpoint={`/api/admin/coupons/${c.id}/status`}
                      active={c.is_active === 1}
                    />
                  </td>
                  <td className="jsgrid-cell jsgrid-control-field jsgrid-align-center">
                    <Link
                      className="btn btn-pill btn-secondary btn-air-secondary btn-sm"
                      href={`/admin/coupons/${c.id}/edit`}
                    >
                      Edit
                    </Link>
                    <AdminDeleteButton
                      endpoint={`/api/admin/coupons/${c.id}`}
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
