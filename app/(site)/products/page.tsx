import type { Metadata } from "next";
import Link from "next/link";
import {
  listProducts,
  type ProductCard,
  type ProductListResult,
} from "@/lib/queries/products";
import { PRODUCT_TYPES, type ProductType } from "@/lib/validators/products";

export const dynamic = "force-dynamic";

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

  return (
    <>
      <section className="inner-banner">
        <div className="container">
          <h1>{headingTitle}</h1>
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
            className="row text-center justify-content-center g-4"
            id="product-grid"
          >
            {result.data.length > 0 ? (
              result.data.map((p) => <ProductTile key={p.id} product={p} />)
            ) : (
              <h4>No products found</h4>
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
    <div className="col-6 col-sm-4 col-md-3 col-lg-3">
      <div className="category-item-annivesary">
        <Link href={href}>
          <div className="birthday-item">
            {/* Use plain <img> to keep markup identical to Blade. Swap to next/image later if you want. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc(product.image)}
              className="default-img"
              alt={name}
              loading="lazy"
            />
          </div>
        </Link>

        <div className="artificial-engvraed">
          <Link href={href}>
            <p>{name}</p>
            <div className="product-price">
              <h2>₹{formatINR(product.finalPrice)}</h2>
              <h6>₹{formatINR(product.price)}</h6>
            </div>
          </Link>
        </div>
      </div>
    </div>
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
