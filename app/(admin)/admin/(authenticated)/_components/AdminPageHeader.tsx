import Link from "next/link";

/**
 * Renders the standard admin page header used by every Pixelstrap "page-title"
 * block in the original Blade views (h3 title + breadcrumbs with home icon).
 *
 * Usage:
 *   <AdminPageHeader
 *     title="Users"
 *     crumbs={[{ label: "Users" }]}
 *   />
 *   <AdminPageHeader
 *     title="Edit Profile"
 *     crumbs={[
 *       { label: "Users", href: "/admin/users" },
 *       { label: "Edit Profile" },
 *     ]}
 *   />
 */
export interface AdminCrumb {
  label: string;
  href?: string;
}

export function AdminPageHeader({
  title,
  crumbs,
}: {
  title: string;
  crumbs: AdminCrumb[];
}) {
  return (
    <div className="container-fluid">
      <div className="page-title">
        <div className="row">
          <div className="col-xl-4 col-sm-7 box-col-3">
            <h3>{title}</h3>
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
              {crumbs.map((c, i) =>
                c.href && i < crumbs.length - 1 ? (
                  <li key={`${c.label}-${i}`} className="breadcrumb-item">
                    <Link href={c.href}>{c.label}</Link>
                  </li>
                ) : (
                  <li
                    key={`${c.label}-${i}`}
                    className="breadcrumb-item active"
                  >
                    {c.label}
                  </li>
                ),
              )}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
