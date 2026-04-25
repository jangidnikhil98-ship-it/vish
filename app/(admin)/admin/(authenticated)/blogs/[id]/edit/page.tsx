import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAdminBlogById } from "@/lib/queries/admin/blogs";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { FlashMessage } from "../../../_components/FlashMessage";
import { BlogForm } from "../../_components/BlogForm";

export const metadata: Metadata = { title: "Edit Blog | Admin" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}

function toIsoDate(d: Date | null): string {
  if (!d) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export default async function AdminBlogEditPage({
  params,
  searchParams,
}: Props) {
  const [{ id: idStr }, sp] = await Promise.all([params, searchParams]);
  const id = Number.parseInt(idStr, 10);
  if (!Number.isFinite(id)) notFound();

  const blog = await getAdminBlogById(id);
  if (!blog) notFound();

  return (
    <>
      <AdminPageHeader
        title="Edit Blog"
        crumbs={[
          { label: "Blogs", href: "/admin/blogs" },
          { label: blog.title ?? "Edit" },
        ]}
      />
      <FlashMessage success={sp.success} error={sp.error} />

      <div className="container-fluid">
        <BlogForm
          mode="edit"
          blogId={blog.id}
          initial={{
            title: blog.title ?? "",
            description: blog.description ?? "",
            published_at: toIsoDate(blog.published_date),
            is_active: blog.is_active === 1 ? 1 : 0,
            image_url: blog.image,
          }}
        />
      </div>
    </>
  );
}
