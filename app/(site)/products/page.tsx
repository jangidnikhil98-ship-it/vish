import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/app/components/JsonLd";
import {
  listProducts,
  type ProductCard,
  type ProductListResult,
} from "@/lib/queries/products";
import { PRODUCT_TYPES, type ProductType } from "@/lib/validators/products";
import "@/app/components/homepage.css";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://vishwakarmagifts.com"
    : "http://localhost:3000")
).replace(/\/$/, "");

// ISR: cached HTML for 60 s. Underlying queries also cached separately.
export const revalidate = 60;

/* ---------- Title + URL helpers ---------- */
const TITLE_MAP: Record<ProductType | "default", string> = {
  birthday: "Birthday Wooden Gifts",
  "wedding-anniversary": "Wedding & Anniversary Wooden Gifts",
  "mothers-day": "Mother's Day Wooden Gifts",
  "fathers-day": "Father's Day Wooden Gifts",
  "teachers-day": "Teacher's Day Wooden Gifts",
  bestseller: "Bestseller Wooden Gifts",
  "natural-wooden-slice": "Natural Wooden Slice Frames",
  "rectangle-wooden-frame": "Rectangle Wooden Frames",
  "corporate-gifts": "Corporate Wooden Gifts",
  default: "All Products",
};

/** Accept old/inconsistent slugs (Birthday, Wedding, MothersDay, etc.) */
function normaliseType(raw: string | undefined): ProductType | undefined {
  if (!raw) return undefined;
  const v = raw.trim().toLowerCase().replace(/\s|_/g, "-");
  const aliases: Record<string, ProductType> = {
    birthday: "birthday",
    wedding: "wedding-anniversary",
    "wedding-anniversary": "wedding-anniversary",
    anniversary: "wedding-anniversary",
    mothersday: "mothers-day",
    "mothers-day": "mothers-day",
    "mother-day": "mothers-day",
    fathersday: "fathers-day",
    "fathers-day": "fathers-day",
    teachersday: "teachers-day",
    "teachers-day": "teachers-day",
    bestseller: "bestseller",
    bestsellers: "bestseller",
    "natural-wooden-slice": "natural-wooden-slice",
    "rectangle-wooden-frame": "rectangle-wooden-frame",
    "corporate-gifts": "corporate-gifts",
    corporate: "corporate-gifts",
    "corporate-gift": "corporate-gifts",
    corporategifts: "corporate-gifts",
  };
  const mapped = aliases[v];
  return mapped && (PRODUCT_TYPES as readonly string[]).includes(mapped)
    ? mapped
    : undefined;
}

const formatINR = (n: number): string =>
  Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const imageSrc = (img: string | null): string =>
  img ? (img.startsWith("http") ? img : `/storage/${img}`) : "/img/no-image.png";

/* ---------- SEO metadata ---------- */
type PageProps = {
  searchParams: Promise<{ type?: string; page?: string }>;
};

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const sp = await searchParams;
  const type = normaliseType(sp.type);
  const title = type ? TITLE_MAP[type] : TITLE_MAP.default;
  const description = `Shop ${title.toLowerCase()} — handcrafted wooden gifts, photo frames and personalised keepsakes from Vishwakarma Gifts.`;
  const canonical = `/products${type ? `?type=${type}` : ""}`;
  return {
    title: `${title} | Vishwakarma Gifts`,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website" },
    robots: { index: true, follow: true },
  };
}

/* ---------- Page ---------- */
export default async function ProductsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const requestedType = normaliseType(sp.type);
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  let result: ProductListResult;
  try {
    result = await listProducts({ type: requestedType, page, perPage: 16 });
  } catch (err) {
    console.error("[products page] DB unavailable:", err);
    result = { data: [], page: 1, perPage: 16, total: 0, totalPages: 1 };
  }

  /**
   * Graceful fallback: if the user clicked a category (Birthday, Anniversary,
   * etc.) but it has no live products yet, fall back to listing ALL products
   * instead of showing an empty page. We track whether we did this so we can
   * show a small banner explaining the switch.
   */
  let usedFallback = false;
  if (requestedType && result.total === 0) {
    try {
      result = await listProducts({
        type: undefined,
        page: 1,
        perPage: 16,
      });
      usedFallback = true;
    } catch (err) {
      console.error("[products page] fallback DB error:", err);
    }
  }

  // Pagination links must NOT keep the type when we're in fallback mode,
  // otherwise clicking "page 2" would return the user to the empty category.
  const paginationType = usedFallback ? undefined : requestedType;
  const requestedTitle = requestedType
    ? TITLE_MAP[requestedType]
    : TITLE_MAP.default;
  const headingTitle = usedFallback ? TITLE_MAP.default : requestedTitle;

  // ItemList JSON-LD: lets Google show this category page as a list of
  // products in search results (great for category-level SEO).
  const itemListJsonLd =
    result.data.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: result.data.slice(0, 24).map((p, i) => ({
            "@type": "ListItem",
            position: (page - 1) * 16 + i + 1,
            url: `${SITE_URL}/products/${p.slug ?? ""}`,
            name: p.name ?? "Product",
          })),
        }
      : null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: headingTitle,
        item: `${SITE_URL}/products${paginationType ? `?type=${paginationType}` : ""}`,
      },
    ],
  };

  return (
    <>
      {itemListJsonLd && <JsonLd data={itemListJsonLd} />}
      <JsonLd data={breadcrumbJsonLd} />

      <section className="inner-banner" style={{ background: "var(--hp-bg-ivory)", padding: "60px 0", borderBottom: "1px solid rgba(201,168,76,0.2)", textAlign: "center" }}>
        <div className="container">
          <h1 className="hp-heading" style={{ color: "var(--hp-text-brown)", fontSize: "42px", margin: "0 auto", textAlign: "center" }}>{headingTitle}</h1>
        </div>
      </section>

      <section className="products-section">
        <div className="container">
          {usedFallback && (
            <div
              className="alert alert-info text-center mb-4"
              role="status"
              style={{ fontSize: "0.95rem" }}
            >
              No items are listed under{" "}
              <strong>{requestedTitle}</strong> right now — showing all
              products instead.
            </div>
          )}

          <div
            className="hp-product-grid mt-4"
            id="product-grid"
          >
            {result.data.length > 0 ? (
              result.data.map((p) => <ProductTile key={p.id} product={p} />)
            ) : (
              <h4 style={{ color: "var(--hp-text-brown)" }}>No products found</h4>
            )}
          </div>

          {result.totalPages > 1 && (
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              type={paginationType}
            />
          )}
        </div>
      </section>
    </>
  );
}

/* ---------- Product card ---------- */
function ProductTile({ product }: { product: ProductCard }) {
  const href = `/products/${product.slug ?? ""}`;
  const name = product.name ?? "Product";
  return (
    <Link
      href={href}
      className="hp-product-card"
      style={{ textDecoration: "none", textAlign: "left" }}
    >
      <div className="hp-product-img-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc(product.image)}
          alt={`${name} - Personalised Wooden Gift`}
          loading="lazy"
        />
        <div className="hp-quick-view">Quick View</div>
      </div>
      <div className="hp-product-info">
        <h3 className="hp-product-title">{name}</h3>
        <div className="hp-product-rating">
          <i className="fa-solid fa-star"></i>
          <i className="fa-solid fa-star"></i>
          <i className="fa-solid fa-star"></i>
          <i className="fa-solid fa-star"></i>
          <i className="fa-solid fa-star"></i>
        </div>
        <div className="hp-product-price-wrap">
          <span className="hp-price-final">₹{formatINR(product.finalPrice)}</span>
          {product.price && product.price > product.finalPrice && (
            <span className="hp-price-old">₹{formatINR(product.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ---------- Pagination ---------- */
function Pagination({
  page,
  totalPages,
  type,
}: {
  page: number;
  totalPages: number;
  type?: ProductType;
}) {
  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/products${qs ? `?${qs}` : ""}`;
  };

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
    <nav className="d-flex justify-content-center mt-5" aria-label="Products pagination">
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
