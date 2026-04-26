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
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const dynamic = "force-dynamic";

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

  const description =
    (product.description ?? "")
      .replace(/<[^>]+>/g, "")
      .slice(0, 155)
      .trim() ||
    `Buy ${productName} — handcrafted personalised wooden gift from Vishwakarma Gifts.`;

  return {
    title: productName,
    description,
    alternates: { canonical: `/products/${productSlug}` },
    openGraph: {
      title: productName,
      description,
      url: `/products/${productSlug}`,
      images: product.image ? [imageSrc(product.image)] : undefined,
      type: "website",
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

                <div className="rating text-warning">
                  <StarRow rating={product.avgRating} />
                  <span className="text-dark">
                    {" "}
                    ({product.avgRating} / 5 • {product.reviewCount} reviews)
                  </span>
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
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RELATED PRODUCTS */}
      {related.length > 0 && (
        <section className="product-section container">
          <div className="row text-center justify-content-center g-4">
            <h3 className="mb-4 similerpro">You may also like</h3>
            {related.map((p) => (
              <div
                key={p.id}
                className="col-6 col-sm-4 col-md-3 col-lg-3"
                data-aos="fade-up"
                data-aos-duration="500"
              >
                <div className="category-item-annivesary">
                  <Link href={`/products/${p.slug ?? ""}`}>
                    <div className="birthday-item">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageSrc(p.image)}
                        alt={p.name ?? "Product"}
                        loading="lazy"
                      />
                    </div>
                  </Link>
                  <div className="artificial-engvraed">
                    <Link href={`/products/${p.slug ?? ""}`}>
                      <p>{p.name ?? "Product"}</p>
                      <div className="product-price">
                        <h2>₹{formatINR(p.finalPrice)}</h2>
                        <h6>₹{formatINR(p.price)}</h6>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* REVIEWS */}
      <section className="review-section container mt-5">
        <h3 className="mb-4" style={{ color: "#613a18" }}>
          Customer Reviews
        </h3>
        <div className="reviews-list">
          {product.reviews.length === 0 ? (
            <p>No reviews available.</p>
          ) : (
            product.reviews.map((r, idx) => (
              <div
                key={idx}
                className="single-review border-bottom pb-3 mb-3"
              >
                <strong>
                  {r.firstName ?? ""} {r.lastName ?? ""}
                </strong>
                <div className="text-warning mb-1">
                  <StarRow rating={r.rating ?? 0} />
                  <span className="text-muted"> ({r.rating ?? 0})</span>
                </div>
                <p>{r.comment}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
