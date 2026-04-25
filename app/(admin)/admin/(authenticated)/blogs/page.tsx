import type { Metadata } from "next";
import Link from "next/link";

import { listAdminBlogs } from "@/lib/queries/admin/blogs";
import { readListParams } from "@/lib/admin-pagination";

import { AdminListShell } from "../_components/AdminListShell";
import { AdminPageHeader } from "../_components/AdminPageHeader";
import { AdminStatusToggle } from "../_components/AdminStatusToggle";
import { AdminDeleteButton } from "../_components/AdminDeleteButton";
import { FlashMessage } from "../_components/FlashMessage";

export const metadata: Metadata = { title: "Blogs | Admin" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    keyword?: string;
    page?: string;
    success?: string;
    error?: string;
  }>;
}

export default async function AdminBlogsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { page, perPage, keyword } = readListParams(sp);

  const result = await listAdminBlogs({ page, perPage, keyword });

  return (
    <>
      <AdminPageHeader title="Blogs" crumbs={[{ label: "Blogs" }]} />
      <FlashMessage success={sp.success} error={sp.error} />

      <AdminListShell
        basePath="/admin/blogs"
        searchPlaceholder="Search by title or description"
        keyword={keyword}
        page={result.page}
        totalPages={result.totalPages}
        createButton={{ href: "/admin/blogs/new", label: "+ Create Blog" }}
      >
        <table className="table userTable">
          <thead>
            <tr className="border-bottom-primary">
              <th>S.No</th>
              <th>Image</th>
              <th>Title</th>
              <th>Published</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.length === 0 ? (
              <tr className="border-bottom-secondary">
                <td colSpan={6} style={{ textAlign: "center" }}>
                  No Records Found
                </td>
              </tr>
            ) : (
              result.rows.map((b, i) => (
                <tr key={b.id} className="border-bottom-secondary">
                  <th scope="row">
                    {(result.page - 1) * result.perPage + i + 1}
                  </th>
                  <td>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={b.image ? `/${b.image}` : "/img/no-image.png"}
                      alt={b.title ?? ""}
                      style={{
                        width: 56,
                        height: 56,
                        objectFit: "cover",
                        borderRadius: 6,
                      }}
                    />
                  </td>
                  <td>
                    <strong>{b.title ?? "—"}</strong>
                    {b.slug ? (
                      <div className="small text-muted">/{b.slug}</div>
                    ) : null}
                  </td>
                  <td>
                    {b.published_date
                      ? new Date(b.published_date).toLocaleDateString()
                      : "—"}
                  </td>
                  <td>
                    <AdminStatusToggle
                      endpoint={`/api/admin/blogs/${b.id}/status`}
                      active={b.is_active === 1}
                    />
                  </td>
                  <td className="jsgrid-cell jsgrid-control-field jsgrid-align-center">
                    <Link
                      className="btn btn-pill btn-info btn-air-info btn-sm"
                      href={`/admin/blogs/${b.id}`}
                    >
                      View
                    </Link>
                    <Link
                      className="btn btn-pill btn-secondary btn-air-secondary btn-sm"
                      href={`/admin/blogs/${b.id}/edit`}
                    >
                      Edit
                    </Link>
                    <AdminDeleteButton
                      endpoint={`/api/admin/blogs/${b.id}`}
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
