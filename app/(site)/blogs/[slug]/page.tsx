import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogBySlug, listBlogs } from "@/lib/queries/blogs";
import JsonLd from "@/app/components/JsonLd";

// ISR: blog detail pages are cached at the edge for 5 min. Admin edits
// already call `bustCache(CACHE_TAGS.blogs)` so updates appear immediately.
export const revalidate = 300;

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

type PageProps = {
  params: Promise<{ slug: string }>;
};

const stripTags = (html: string): string =>
  html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

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

/**
 * Resolve a stored image path to a public URL.
 *
 * Admins save blog images as `storage/blogs/<file>.webp` (mirroring the old
 * Laravel layout), so we just normalise that to `/storage/blogs/<file>.webp`.
 * Also handles full URLs and already-rooted paths defensively.
 */
const resolveImage = (img: string | null): string => {
  if (!img) return "/img/no-image.png";
  if (img.startsWith("http")) return img;
  if (img.startsWith("/")) return img;
  return `/${img}`;
};

/* ---------- SEO metadata ---------- */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug).catch(() => null);
  if (!blog) return { title: "Blog not found" };

  const title = blog.title ?? "Blog";
  const description =
    stripTags(blog.description ?? "").slice(0, 155).trim() ||
    `Read "${title}" on the Vishwakarma Gifts blog.`;
  const ogImage = blog.image ? resolveImage(blog.image) : "/img/banner.webp";

  return {
    title,
    description,
    alternates: { canonical: `/blogs/${blog.slug ?? slug}` },
    openGraph: {
      title,
      description,
      url: `/blogs/${blog.slug ?? slug}`,
      images: [{ url: ogImage, alt: title }],
      type: "article",
      siteName: "Vishwakarma Gifts",
      publishedTime: blog.publishedDate
        ? new Date(blog.publishedDate).toISOString()
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: { index: true, follow: true },
  };
}

/* ---------- Page ---------- */
export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug).catch(() => null);
  if (!blog) notFound();

  const title = blog.title ?? "Blog";
  const image = resolveImage(blog.image);
  const published = blog.publishedDate ?? blog.createdAt;
  const publishedISO = published ? new Date(published).toISOString() : null;
  const publishedHuman = formatDate(published);

  // Pull the most recent 3 other posts (excluding this one) for "read next".
  let related: Awaited<ReturnType<typeof listBlogs>>["data"] = [];
  try {
    const list = await listBlogs(1, 6);
    related = list.data.filter((b) => b.slug !== blog.slug).slice(0, 3);
  } catch {
    /* non-fatal — just skip the related rail */
  }

  /* ---------- JSON-LD ---------- */
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    image: [image.startsWith("http") ? image : `${SITE_URL}${image}`],
    datePublished: publishedISO ?? undefined,
    dateModified: publishedISO ?? undefined,
    author: {
      "@type": "Organization",
      name: "Vishwakarma Gifts",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Vishwakarma Gifts",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/img/logo.svg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blogs/${blog.slug ?? slug}`,
    },
    description: stripTags(blog.description ?? "").slice(0, 300),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blogs", item: `${SITE_URL}/blogs` },
      {
        "@type": "ListItem",
        position: 3,
        name: title,
        item: `${SITE_URL}/blogs/${blog.slug ?? slug}`,
      },
    ],
  };

  return (
    <>
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <section className="inner-banner">
        <div className="container">
          <h1>{title}</h1>
          {publishedHuman ? (
            <p>
              <i className="far fa-calendar-alt" /> {publishedHuman}
            </p>
          ) : null}
        </div>
      </section>

      <article className="container py-5 blog-detail">
        <div className="row justify-content-center">
          <div className="col-lg-9">
            {blog.image ? (
              <div className="blog-detail-hero mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt={title}
                  className="img-fluid w-100"
                  width="1200"
                  height="630"
                  fetchPriority="high"
                  decoding="async"
                  style={{
                    borderRadius: 12,
                    objectFit: "cover",
                    maxHeight: 480,
                  }}
                />
              </div>
            ) : null}

            {publishedISO ? (
              <p className="text-muted mb-4">
                <i className="far fa-calendar-alt" />{" "}
                <time dateTime={publishedISO}>{publishedHuman}</time>
              </p>
            ) : null}

            {/* Admin authors with a rich-text editor — render the stored HTML.
                Fields written through the admin form are sanitised server-side. */}
            <div
              className="blog-content-body"
              dangerouslySetInnerHTML={{ __html: blog.description ?? "" }}
            />

            <div className="mt-5 d-flex flex-wrap gap-3">
              <Link href="/blogs" className="btn btn-outline-dark">
                <i className="fas fa-arrow-left me-2" />
                Back to all blogs
              </Link>
              <Link href="/products" className="btn btn-dark">
                Browse products
              </Link>
            </div>
          </div>
        </div>

        {related.length > 0 ? (
          <section className="mt-5 pt-4 border-top">
            <h2 className="h4 mb-4">You might also like</h2>
            <div className="row g-4">
              {related.map((r) => (
                <div key={r.id} className="col-md-4">
                  <article className="blog-card h-100">
                    <div className="blog-image">
                      <Link href={`/blogs/${r.slug ?? ""}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={resolveImage(r.image)}
                          alt={r.title ?? "Blog post"}
                          loading="lazy"
                          decoding="async"
                        />
                      </Link>
                    </div>
                    <div className="blog-content">
                      <div className="blog-meta">
                        <span>
                          <i className="far fa-calendar-alt" />{" "}
                          {formatDate(r.publishedDate ?? r.createdAt)}
                        </span>
                      </div>
                      <h3>
                        <Link href={`/blogs/${r.slug ?? ""}`}>
                          {r.title ?? "Untitled"}
                        </Link>
                      </h3>
                      <Link
                        href={`/blogs/${r.slug ?? ""}`}
                        className="read-more"
                      >
                        Read More <i className="fas fa-arrow-right" />
                      </Link>
                    </div>
                  </article>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </article>

      {/* Lightweight typography rules for admin-authored HTML. Scoped to
          .blog-content-body so they don't leak elsewhere. */}
      <style>{`
        .blog-content-body { font-size: 17px; line-height: 1.75; color: #333; }
        .blog-content-body h1,
        .blog-content-body h2,
        .blog-content-body h3,
        .blog-content-body h4 {
          color: #613a18;
          font-weight: 700;
          margin: 1.6em 0 0.6em;
        }
        .blog-content-body h2 { font-size: 1.6rem; }
        .blog-content-body h3 { font-size: 1.3rem; }
        .blog-content-body p { margin-bottom: 1.1em; }
        .blog-content-body img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1em 0;
        }
        .blog-content-body a { color: #613a18; text-decoration: underline; }
        .blog-content-body ul,
        .blog-content-body ol { padding-left: 1.4rem; margin-bottom: 1.1em; }
        .blog-content-body li { margin-bottom: 0.4em; }
        .blog-content-body blockquote {
          border-left: 4px solid #613a18;
          background: #faf6f1;
          padding: 14px 18px;
          margin: 1.4em 0;
          border-radius: 4px;
          color: #4a3520;
          font-style: italic;
        }
        .blog-content-body pre,
        .blog-content-body code {
          background: #f4ede5;
          border-radius: 4px;
          padding: 2px 6px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.92em;
        }
      `}</style>
    </>
  );
}
