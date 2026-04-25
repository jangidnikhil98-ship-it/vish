import type { Metadata } from "next";

import { listAdminEnquiries } from "@/lib/queries/admin/enquiries";
import { readListParams } from "@/lib/admin-pagination";

import { AdminListShell } from "../_components/AdminListShell";
import { AdminPageHeader } from "../_components/AdminPageHeader";
import { AdminDeleteButton } from "../_components/AdminDeleteButton";
import { FlashMessage } from "../_components/FlashMessage";

export const metadata: Metadata = { title: "Contact Inquiries | Admin" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    keyword?: string;
    page?: string;
    success?: string;
    error?: string;
  }>;
}

export default async function AdminInquiriesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { page, perPage, keyword } = readListParams(sp);

  const result = await listAdminEnquiries({ page, perPage, keyword });

  return (
    <>
      <AdminPageHeader
        title="Contact Inquiries"
        crumbs={[{ label: "Contact Inquiries" }]}
      />
      <FlashMessage success={sp.success} error={sp.error} />

      <AdminListShell
        basePath="/admin/inquiries"
        searchPlaceholder="Search by name, email, message"
        keyword={keyword}
        page={result.page}
        totalPages={result.totalPages}
      >
        <table className="table userTable">
          <thead>
            <tr className="border-bottom-primary">
              <th>S.No</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Message</th>
              <th>Received</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.length === 0 ? (
              <tr className="border-bottom-secondary">
                <td colSpan={7} style={{ textAlign: "center" }}>
                  No Records Found
                </td>
              </tr>
            ) : (
              result.rows.map((row, i) => (
                <tr key={row.id} className="border-bottom-secondary">
                  <th scope="row">
                    {(result.page - 1) * result.perPage + i + 1}
                  </th>
                  <td>{row.full_name ?? "—"}</td>
                  <td>
                    {row.email ? (
                      <a href={`mailto:${row.email}`}>{row.email}</a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {row.phone ? (
                      <a href={`tel:${row.phone}`}>{row.phone}</a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td style={{ maxWidth: 360, whiteSpace: "pre-wrap" }}>
                    {row.message}
                  </td>
                  <td>
                    {row.created_at
                      ? new Date(row.created_at).toLocaleString()
                      : "—"}
                  </td>
                  <td>
                    <AdminDeleteButton
                      endpoint={`/api/admin/inquiries/${row.id}`}
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
