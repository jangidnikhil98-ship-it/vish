import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard",
};

/**
 * Skeleton port of `resources/views/backend/dashboard.blade.php`.
 *
 * The original Blade was full of demo/static fake data (Apex charts,
 * pretend orders, hard-coded avatars). We render the Pixelstrap "page-title"
 * + breadcrumbs in the same DOM as the theme expects, plus quick links to
 * each admin module. We'll wire real charts/cards once the OrdersController
 * + ProductsController + UserController are ported.
 */
export default function AdminDashboardPage() {
  const tiles: Array<{ href: string; title: string; icon: string }> = [
    { href: "/admin/users", title: "Users", icon: "stroke-user" },
    { href: "/admin/products", title: "Products", icon: "stroke-ecommerce" },
    { href: "/admin/orders", title: "Orders", icon: "stroke-job-search" },
    {
      href: "/admin/transactions",
      title: "Transactions",
      icon: "stroke-job-search",
    },
    { href: "/admin/blogs", title: "Blogs", icon: "stroke-editors" },
    {
      href: "/admin/contact-us",
      title: "Inquiries",
      icon: "stroke-editors",
    },
  ];

  return (
    <>
      <div className="container-fluid">
        <div className="page-title">
          <div className="row">
            <div className="col-xl-4 col-sm-7 box-col-3">
              <h3>Dashboard</h3>
            </div>
            <div className="col-5 d-none d-xl-block" />
            <div className="col-xl-3 col-sm-5 box-col-4">
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <Link href="/admin/dashboard">
                    <svg className="stroke-icon">
                      <use href="/backend/svg/icon-sprite.svg#stroke-home" />
                    </svg>
                  </Link>
                </li>
                <li className="breadcrumb-item">Dashboard</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid default-dashboard">
        <div className="row">
          {tiles.map((tile) => (
            <div
              key={tile.href}
              className="col-xl-4 col-md-6 box-col-6 proorder-md-3"
            >
              <Link href={tile.href} className="text-decoration-none">
                <div className="card">
                  <div className="card-body d-flex align-items-center gap-3">
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        background: "#f5ece2",
                        borderRadius: 12,
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <svg style={{ width: 22, height: 22 }}>
                        <use
                          href={`/backend/svg/icon-sprite.svg#${tile.icon}`}
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="mb-0" style={{ color: "#603813" }}>
                        {tile.title}
                      </h4>
                      <span className="text-muted">Manage {tile.title}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
