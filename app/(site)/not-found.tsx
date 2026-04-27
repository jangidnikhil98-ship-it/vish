import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found",
  description:
    "The page you are looking for does not exist or has been moved. Browse our personalised wooden gifts at Vishwakarma Gifts.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <section
      className="container py-5 text-center"
      style={{ minHeight: "60vh" }}
    >
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <h1
            style={{
              fontSize: "clamp(3rem, 10vw, 5.5rem)",
              fontWeight: 700,
              color: "#613A18",
              marginBottom: "0.5rem",
            }}
          >
            404
          </h1>
          <h2 className="h4 mb-3">We couldn’t find that page</h2>
          <p className="text-muted mb-4">
            The link may be broken, or the page may have been removed. While
            you’re here, take a look at our handcrafted personalised wooden
            gifts.
          </p>
          <div className="d-flex flex-wrap justify-content-center gap-3">
            <Link href="/" className="btn btn-dark px-4">
              Back to Home
            </Link>
            <Link
              href="/products"
              className="btn btn-outline-dark px-4"
              style={{ borderColor: "#613A18", color: "#613A18" }}
            >
              Shop Products
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
