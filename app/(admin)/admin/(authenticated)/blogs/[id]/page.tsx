import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getAdminBlogById } from "@/lib/queries/admin/blogs";
import { AdminPageHeader } from "../../_components/AdminPageHeader";

export const metadata: Metadata = { title: "Blog Details | Admin" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminBlogViewPage({ params }: Props) {
  const { id: idStr } = await params;
  const id = Number.parseInt(idStr, 10);
  if (!Number.isFinite(id)) notFound();

  const blog = await getAdminBlogById(id);
  if (!blog) notFound();

  return (
    <>
      <AdminPageHeader
        title="Blog Details"
        crumbs={[
          { label: "Blogs", href: "/admin/blogs" },
          { label: blog.title ?? "Blog" },
        ]}
      />

      <div className="container-fluid">
        <div className="card">
          <div className="card-header pb-0 d-flex justify-content-between align-items-center">
            <h4 className="mb-0">{blog.title}</h4>
            <Link
              href={`/admin/blogs/${blog.id}/edit`}
              className="btn btn-pill btn-secondary btn-sm"
            >
              Edit
            </Link>
          </div>
          <div className="card-body">
            {blog.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/${blog.image}`}
                alt={blog.title ?? ""}
                style={{
                  width: "100%",
                  maxHeight: 320,
                  objectFit: "cover",
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              />
            ) : null}
            <div className="d-flex gap-3 mb-3">
              <span className="badge rounded-pill badge-info p-2">
                {blog.published_date
                  ? `Published: ${new Date(blog.published_date).toLocaleDateString()}`
                  : "Draft"}
              </span>
              <span
                className={
                  "badge rounded-pill p-2 " +
                  (blog.is_active === 1 ? "badge-success" : "badge-danger")
                }
              >
                {blog.is_active === 1 ? "Active" : "Inactive"}
              </span>
            </div>
            <div
              dangerouslySetInnerHTML={{ __html: blog.description ?? "" }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
