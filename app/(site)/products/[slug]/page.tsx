import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProductBySlug,
  getRelatedProducts,
  type ProductCard,
  type ProductDetail,
} from "@/lib/queries/products";
import JsonLd from "@/app/components/JsonLd";
import { Gallery, Form } from "./ProductDetailsClient";
import "./product-details.css";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://vishwakarmagifts.com"
    : "http://localhost:3000")
).replace(/\/$/, "");

// ISR: each product page is cached at the edge for 5 minutes. Admin edits
// already call `bustCache(CACHE_TAGS.products)` to revalidate immediately.
export const revalidate = 300;

type PageProps = {
  params: Promise<{ slug: string }>;
};

const formatINR = (n: number): string =>
  Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const imageSrc = (img: string | null): string => {
  if (!img) return "/img/no-image.png";
  if (img.startsWith("http") || img.startsWith("/")) return img;
  return `/storage/${img}`;
};

/* ---------- SEO metadata ---------- */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug).catch(() => null);
  if (!product) return { title: "Product not found" };

  const productName = product.name ?? "Product";
  const productSlug = product.slug ?? slug;

  const cleanDescription = (product.description ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();

  const description =
    cleanDescription.slice(0, 155).trim() ||
    `Buy ${productName} — handcrafted personalised wooden gift from Vishwakarma Gifts.`;

  const ogImage = product.image ? imageSrc(product.image) : "/img/banner.webp";
  const seoTitle = `${productName} | Vishwakarma Gifts`;

  return {
    title: seoTitle,
    description,
    alternates: { canonical: `/products/${productSlug}` },
    openGraph: {
      title: seoTitle,
      description,
      url: `/products/${productSlug}`,
      images: [{ url: ogImage, alt: `${productName} - Personalised Wooden Gift | Vishwakarma Gifts` }],
      type: "website",
      siteName: "Vishwakarma Gifts",
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description,
      images: [ogImage],
    },
    robots: { index: true, follow: true },
  };
}

/* ---------- Star rating display ---------- */
function StarRow({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  const empty = 5 - full - (hasHalf ? 1 : 0);
  return (
    <>
      {Array.from({ length: full }, (_, i) => (
        <span key={`f-${i}`}>★</span>
      ))}
      {hasHalf && <span>☆</span>}
      {Array.from({ length: empty }, (_, i) => (
        <span key={`e-${i}`}>☆</span>
      ))}
    </>
  );
}

/* ---------- Page ---------- */
export default async function ProductDetailsPage({ params }: PageProps) {
  const { slug } = await params;

  let product: ProductDetail | null = null;
  let related: ProductCard[] = [];
  try {
    product = await getProductBySlug(slug);
    if (product) related = await getRelatedProducts(product.id, 4);
  } catch (err) {
    console.error("[product details] DB error:", err);
  }

  if (!product) notFound();

  const defaultSize =
    product.sizes.find((s) => s.isDefault) ?? product.sizes[0] ?? null;

  const productUrl = `${SITE_URL}/products/${product.slug ?? slug}`;
  const productImages =
    product.images.length > 0
      ? product.images.map((img) =>
          img.startsWith("http") || img.startsWith("/")
            ? `${SITE_URL}${img.startsWith("/") ? img : `/${img}`}`
            : `${SITE_URL}/storage/${img}`,
        )
      : [`${SITE_URL}${imageSrc(product.image)}`];
  const cleanDescription = (product.description ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name ?? "Product",
    image: productImages,
    description: cleanDescription || `${product.name ?? "Product"} from Vishwakarma Gifts`,
    sku: String(product.id),
    brand: { "@type": "Brand", name: "Vishwakarma Gifts" },
    ...(product.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.avgRating.toFixed(1),
            reviewCount: product.reviewCount,
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "INR",
      price: (defaultSize?.finalPrice ?? product.finalPrice).toFixed(2),
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Products",
        item: `${SITE_URL}/products`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name ?? "Product",
        item: productUrl,
      },
    ],
  };

  return (
    <>
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <section className="product-inner-page-content">
        <div className="container">
          <div className="row">
            {/* LEFT — gallery (interactive, client) */}
            <div className="col-md-6">
              <Gallery
                images={product.images}
                fallbackImage={imageSrc(product.image)}
                productName={product.name ?? "Product"}
              />
            </div>

            {/* RIGHT — details + customisation form (client) */}
            <div className="col-md-6">
              <div className="product-details-outer">
                <h1 className="product-title">{product.name ?? "Product"}</h1>

                <div className="premium-rating">
                  <span className="stars"><StarRow rating={product.avgRating} /></span>
                  <span className="count">({product.avgRating} / 5 • {product.reviewCount} reviews)</span>
                </div>

                <Form
                  productId={product.id}
                  productType={product.product_type ?? ""}
                  productName={product.name ?? "Product"}
                  productSlug={product.slug ?? slug}
                  productImage={imageSrc(product.image)}
                  sizes={product.sizes}
                  initialSizeId={defaultSize?.id}
                />

                <div className="premium-trust-badges">
                  <div className="premium-badge">
                    <i className="fa-solid fa-lock" />
                    <p>Secure Checkout</p>
                  </div>
                  <div className="premium-badge">
                    <i className="fa-solid fa-medal" />
                    <p>Premium Quality</p>
                  </div>
                  <div className="premium-badge">
                    <i className="fa-solid fa-box-open" />
                    <p>Easy Returns</p>
                  </div>
                </div>

                <div className="premium-delivery-estimate mt-4">
                  <i className="fa-regular fa-calendar-check" />
                  <p>
                    <strong>Estimated Delivery:</strong> Usually ships in 24-48 hours.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DETAILED DESCRIPTION */}
      {product.description && (
        <section className="container mt-5">
          <div className="row justify-content-center">
            <div className="col-md-8">
              <h3 className="premium-section-title">Product Details</h3>
              <div 
                className="premium-description text-muted" 
                style={{ lineHeight: '1.8', fontSize: '15px' }}
                dangerouslySetInnerHTML={{ __html: product.description }} 
              />
            </div>
          </div>
        </section>
      )}

      {/* RELATED PRODUCTS */}
      {related.length > 0 && (
        <section className="premium-related-section mt-5">
          <div className="container">
            <h3 className="premium-section-title">Perfect Pairings</h3>
            <div className="row row-cols-2 row-cols-md-4 g-4">
              {related.map((p) => (
                <div key={p.id} className="col">
                  <div className="premium-product-card">
                    <Link href={`/products/${p.slug ?? ""}`} style={{ textDecoration: 'none' }}>
                      <div className="premium-card-img">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageSrc(p.image)}
                          alt={`${p.name ?? "Product"} | Vishwakarma Gifts`}
                          loading="lazy"
                        />
                      </div>
                      <div className="premium-card-info">
                        <h4 className="premium-card-title">{p.name ?? "Product"}</h4>
                        <div className="premium-card-price">
                          ₹{formatINR(p.finalPrice)}
                          {p.price && p.price > p.finalPrice && (
                            <span className="old">₹{formatINR(p.price)}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* REVIEWS */}
      <section className="premium-review-section">
        <div className="container">
          <h3 className="premium-section-title">Customer Reviews</h3>
          <div className="row justify-content-center">
            <div className="col-md-8">
              {product.reviews.length === 0 ? (
                <p className="text-center text-muted">No reviews available yet.</p>
              ) : (
                product.reviews.map((r, idx) => (
                  <div key={idx} className="premium-review-card">
                    <div className="d-flex align-items-center mb-2">
                      <strong style={{ color: 'var(--color-premium-brown)', marginRight: '10px' }}>
                        {r.firstName ?? ""} {r.lastName ?? ""}
                      </strong>
                      <span className="text-warning">
                        <StarRow rating={r.rating ?? 0} />
                      </span>
                    </div>
                    <p className="mb-0 text-muted">{r.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
