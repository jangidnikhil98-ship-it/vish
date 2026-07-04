import type { Metadata } from "next";
import Link from "next/link";
import { listAdminReviews } from "@/lib/queries/admin/reviews";
import { readListParams } from "@/lib/admin-pagination";
import { AdminListShell } from "../_components/AdminListShell";
import { AdminPageHeader } from "../_components/AdminPageHeader";
import { AdminDeleteButton } from "../_components/AdminDeleteButton";
import { FlashMessage } from "../_components/FlashMessage";

export const metadata: Metadata = { title: "Reviews | Admin" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    keyword?: string;
    page?: string;
    success?: string;
    error?: string;
  }>;
}

export default async function AdminReviewsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { page, perPage, keyword } = readListParams(sp);

  const result = await listAdminReviews({ page, perPage, keyword });

  return (
    <>
      <AdminPageHeader title="Customer Reviews" crumbs={[{ label: "Reviews" }]} />
      <FlashMessage success={sp.success} error={sp.error} />

      <AdminListShell
        basePath="/admin/reviews"
        searchPlaceholder="Search by name or comment"
        keyword={keyword}
        page={result.page}
        totalPages={result.totalPages}
        createButton={{ href: "/admin/reviews/new", label: "+ Add Review" }}
      >
        <table className="table userTable">
          <thead>
            <tr className="border-bottom-primary">
              <th>S.No</th>
              <th>Image</th>
              <th>Product</th>
              <th>Customer</th>
              <th>Rating</th>
              <th>Comment</th>
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
              result.rows.map((r, i) => (
                <tr key={r.id} className="border-bottom-secondary">
                  <th scope="row">
                    {(result.page - 1) * result.perPage + i + 1}
                  </th>
                  <td>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.image_url ? `/${r.image_url}` : "/img/no-image.png"}
                      alt={r.firstName ?? "Reviewer"}
                      style={{
                        width: 56,
                        height: 56,
                        objectFit: "cover",
                        borderRadius: 6,
                      }}
                    />
                  </td>
                  <td>
                    <div style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.productName ?? "Global (No Product)"}
                    </div>
                  </td>
                  <td>
                    <strong>{r.firstName} {r.lastName}</strong>
                  </td>
                  <td>
                    {r.rating} / 5
                  </td>
                  <td>
                    <div style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.comment}
                    </div>
                  </td>
                  <td>
                    {r.created_at
                      ? new Date(r.created_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="jsgrid-cell jsgrid-control-field jsgrid-align-center">
                    <Link
                      className="btn btn-pill btn-secondary btn-air-secondary btn-sm"
                      href={`/admin/reviews/${r.id}/edit`}
                    >
                      Edit
                    </Link>
                    <AdminDeleteButton
                      endpoint={`/api/admin/reviews/${r.id}`}
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
