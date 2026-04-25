"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface BlogFormProps {
  mode: "create" | "edit";
  blogId?: number;
  initial: {
    title: string;
    description: string;
    published_at: string;
    is_active: 0 | 1;
    image_url: string | null;
  };
}

export function BlogForm({ mode, blogId, initial }: BlogFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [publishedAt, setPublishedAt] = useState(initial.published_at);
  const [isActive, setIsActive] = useState<0 | 1>(initial.is_active);
  const [file, setFile] = useState<File | null>(null);
  const [topError, setTopError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setTopError(null);
    setErrors({});

    const fd = new FormData();
    fd.set("title", title);
    fd.set("description", description);
    fd.set("published_at", publishedAt);
    fd.set("is_active", String(isActive));
    if (file) fd.set("image", file);

    try {
      const url =
        mode === "create" ? "/api/admin/blogs" : `/api/admin/blogs/${blogId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, { method, body: fd });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.errors) {
          const flat: Record<string, string> = {};
          for (const [k, arr] of Object.entries(
            data.errors as Record<string, string[]>,
          )) {
            flat[k] = arr?.[0] ?? "Invalid value";
          }
          setErrors(flat);
        }
        setTopError(data.message ?? "Failed to save blog");
        return;
      }
      const id = mode === "create" ? data.data.id : blogId;
      router.push(
        `/admin/blogs/${id}/edit?success=${encodeURIComponent(
          mode === "create"
            ? "Blog created successfully."
            : "Blog updated successfully.",
        )}`,
      );
      router.refresh();
    } catch {
      setTopError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} encType="multipart/form-data" noValidate>
      {topError ? <div className="alert alert-danger">{topError}</div> : null}
      <div className="card">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-8">
              <label className="form-label">Title</label>
              <input
                type="text"
                className={`form-control ${errors.title ? "is-invalid" : ""}`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              {errors.title ? (
                <div className="invalid-feedback">{errors.title}</div>
              ) : null}
            </div>
            <div className="col-md-2">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={isActive}
                onChange={(e) =>
                  setIsActive(Number(e.target.value) as 0 | 1)
                }
              >
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Published Date</label>
              <input
                type="date"
                className={`form-control ${errors.published_at ? "is-invalid" : ""}`}
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                required
              />
              {errors.published_at ? (
                <div className="invalid-feedback">{errors.published_at}</div>
              ) : null}
            </div>

            <div className="col-12">
              <label className="form-label">Featured Image</label>
              {initial.image_url ? (
                <div className="mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/${initial.image_url}`}
                    alt={title}
                    style={{
                      maxWidth: 220,
                      maxHeight: 140,
                      objectFit: "cover",
                      borderRadius: 6,
                    }}
                  />
                </div>
              ) : null}
              <input
                type="file"
                accept="image/*"
                className={`form-control ${errors.image ? "is-invalid" : ""}`}
                onChange={(e) =>
                  setFile(e.target.files?.[0] ?? null)
                }
              />
              {errors.image ? (
                <div className="invalid-feedback">{errors.image}</div>
              ) : null}
            </div>

            <div className="col-12">
              <label className="form-label">Description</label>
              <textarea
                rows={10}
                className={`form-control ${errors.description ? "is-invalid" : ""}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              {errors.description ? (
                <div className="invalid-feedback">{errors.description}</div>
              ) : null}
              <small className="text-muted">
                Plain text or simple HTML is accepted.
              </small>
            </div>

            <div className="col-12 d-flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy
                  ? "Saving…"
                  : mode === "create"
                    ? "Create Blog"
                    : "Update Blog"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
