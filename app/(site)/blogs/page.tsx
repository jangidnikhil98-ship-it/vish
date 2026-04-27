import type { Metadata } from "next";
import Link from "next/link";
import {
  listBlogs,
  type BlogCard,
  type BlogListResult,
} from "@/lib/queries/blogs";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "News & Blogs",
  description:
    "Read the latest articles, stories, and gifting ideas from Vishwakarma Gifts.",
  alternates: { canonical: "/blogs" },
  openGraph: {
    title: "News & Blogs | Vishwakarma Gifts",
    description:
      "Read the latest articles, stories, and gifting ideas from Vishwakarma Gifts.",
    url: "/blogs",
    type: "website",
  },
  robots: { index: true, follow: true },
};

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

/* ---------- helpers ---------- */
const formatDate = (d: Date | string | null): string => {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const stripTags = (html: string): string => html.replace(/<[^>]*>/g, "");
const truncate = (s: string, max = 120): string =>
  s.length > max ? `${s.slice(0, max).trimEnd()}…` : s;

const imageSrc = (img: string | null): string => {
  if (!img) return "/img/no-image.png";
  if (img.startsWith("http")) return img;
  if (img.startsWith("/")) return img;
  return `/${img}`;
};

/* ---------- page ---------- */
export default async function BlogsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  let result: BlogListResult;
  try {
    result = await listBlogs(page, 10);
  } catch (err) {
    console.error("[blogs page] DB unavailable:", err);
    result = { data: [], page: 1, perPage: 10, total: 0, totalPages: 1 };
  }

  return (
    <>
      {/* Blog Hero */}
      <section className="inner-banner">
        <h2>News & Blogs</h2>
        <p>Stay updated with our latest posts.</p>
      </section>

      <div className="container pt-4">
        <div>
          {result.data.length > 0 && (
            <div className="row">
              {result.data.map((blog) => (
                <BlogCardItem key={blog.id} blog={blog} />
              ))}
            </div>
          )}

          {result.data.length === 0 && (
            <div className="text-center py-5">
              <h4>No posts yet — check back soon.</h4>
            </div>
          )}
        </div>

        {result.totalPages > 1 && (
          <Pagination page={result.page} totalPages={result.totalPages} />
        )}
      </div>
    </>
  );
}

/* ---------- card ---------- */
function BlogCardItem({ blog }: { blog: BlogCard }) {
  const href = `/blogs/${blog.slug ?? ""}`;
  const summary = truncate(stripTags(blog.description ?? ""), 120);

  return (
    <div className="col-md-3 pb-4 mb-4">
      <article className="blog-card">
        <div className="blog-image">
          <Link href={href}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc(blog.image)}
              alt={blog.title ?? "Blog post"}
              loading="lazy"
            />
          </Link>
        </div>
        <div className="blog-content">
          <div className="blog-meta">
            <span>
              <i className="far fa-calendar-alt" />{" "}
              {formatDate(blog.publishedDate ?? blog.createdAt)}
            </span>
          </div>
          <h3>
            <Link href={href}>{blog.title ?? "Untitled"}</Link>
          </h3>
          <p>{summary}</p>
          <Link href={href} className="read-more">
            Read More <i className="fas fa-arrow-right" />
          </Link>
        </div>
      </article>
    </div>
  );
}

/* ---------- pagination ---------- */
function Pagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const buildHref = (p: number) =>
    p <= 1 ? "/blogs" : `/blogs?page=${p}`;

  const window = 2;
  const pages: number[] = [];
  for (
    let i = Math.max(1, page - window);
    i <= Math.min(totalPages, page + window);
    i++
  ) {
    pages.push(i);
  }

  return (
    <nav className="pagination" aria-label="Blogs pagination">
      <ul className="pagination">
        <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
          <Link
            className="page-link"
            href={buildHref(Math.max(1, page - 1))}
            aria-label="Previous"
          >
            &laquo;
          </Link>
        </li>
        {pages[0] !== 1 && (
          <>
            <li className="page-item">
              <Link className="page-link" href={buildHref(1)}>
                1
              </Link>
            </li>
            {pages[0] > 2 && (
              <li className="page-item disabled">
                <span className="page-link">…</span>
              </li>
            )}
          </>
        )}
        {pages.map((p) => (
          <li key={p} className={`page-item ${p === page ? "active" : ""}`}>
            <Link className="page-link" href={buildHref(p)}>
              {p}
            </Link>
          </li>
        ))}
        {pages[pages.length - 1] !== totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && (
              <li className="page-item disabled">
                <span className="page-link">…</span>
              </li>
            )}
            <li className="page-item">
              <Link className="page-link" href={buildHref(totalPages)}>
                {totalPages}
              </Link>
            </li>
          </>
        )}
        <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
          <Link
            className="page-link"
            href={buildHref(Math.min(totalPages, page + 1))}
            aria-label="Next"
          >
            &raquo;
          </Link>
        </li>
      </ul>
    </nav>
  );
}
