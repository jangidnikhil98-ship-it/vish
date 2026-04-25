import type { Metadata } from "next";

import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { FlashMessage } from "../../_components/FlashMessage";
import { BlogForm } from "../_components/BlogForm";

export const metadata: Metadata = { title: "Create Blog | Admin" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ success?: string; error?: string }>;
}

export default async function AdminBlogNewPage({ searchParams }: Props) {
  const sp = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  return (
    <>
      <AdminPageHeader
        title="Create Blog"
        crumbs={[
          { label: "Blogs", href: "/admin/blogs" },
          { label: "Create" },
        ]}
      />
      <FlashMessage success={sp.success} error={sp.error} />

      <div className="container-fluid">
        <BlogForm
          mode="create"
          initial={{
            title: "",
            description: "",
            published_at: today,
            is_active: 1,
            image_url: null,
          }}
        />
      </div>
    </>
  );
}
