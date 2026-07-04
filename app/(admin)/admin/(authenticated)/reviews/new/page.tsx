import type { Metadata } from "next";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ratting } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { CACHE_TAGS } from "@/lib/cache";

export const metadata: Metadata = { title: "Add Review | Admin" };

export default async function AdminReviewNewPage() {
  async function createReview(formData: FormData) {
    "use server";
    const productId = Number(formData.get("product_id"));
    const firstName = formData.get("first_name")?.toString() || "Anonymous";
    const lastName = formData.get("last_name")?.toString() || "";
    const rating = Number(formData.get("rating")) || 5;
    const comment = formData.get("comment")?.toString() || "";
    const imageUrl = formData.get("image_url")?.toString() || null;

    await db.insert(ratting).values({
      product_id: isNaN(productId) || productId === 0 ? sql`NULL` : productId,
      user_id: 1, // Admin adding review, default to user 1
      first_name: firstName,
      last_name: lastName,
      rating,
      comment,
      image_url: imageUrl,
      created_at: new Date(),
      updated_at: new Date(),
    } as any);

    revalidateTag(CACHE_TAGS.products);
    redirect("/admin/reviews?success=Review added");
  }

  return (
    <>
      <AdminPageHeader
        title="Add Review"
        crumbs={[
          { label: "Reviews", href: "/admin/reviews" },
          { label: "Add" },
        ]}
      />

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5>Review Details</h5>
            </div>
            <div className="card-body">
              <form action={createReview} className="theme-form mega-form">
                <div className="row">
                  {/* Basic Details */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">First Name *</label>
                      <input type="text" name="first_name" className="form-control" required />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Last Name</label>
                      <input type="text" name="last_name" className="form-control" />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Rating (1-5) *</label>
                      <input type="number" name="rating" min="1" max="5" defaultValue="5" className="form-control" required />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Product ID (Leave blank for global review)</label>
                      <input type="number" name="product_id" className="form-control" />
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="mb-3">
                      <label className="form-label">Comment</label>
                      <textarea name="comment" className="form-control" rows={4}></textarea>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="mb-3">
                      <label className="form-label">Customer Image URL</label>
                      <input type="text" name="image_url" className="form-control" placeholder="uploads/products/... or valid URL" />
                      <small className="text-muted">You can enter a relative path (e.g. uploads/products/abc.jpg) to display in the customer gallery.</small>
                    </div>
                  </div>
                </div>

                <hr className="mt-4 mb-4" />
                <button type="submit" className="btn btn-primary">
                  Save Review
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
