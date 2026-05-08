import Link from "next/link";
import type { PublicUser } from "@/lib/queries/users";
import AdminLogoutButton from "./AdminLogoutButton";

/**
 * Port of `resources/views/backend/includes/header.blade.php`.
 * Same DOM/classes as the Pixelstrap Zono theme.
 */
export default function AdminHeader({ user }: { user: PublicUser }) {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ");
  const roleLabel = (user.role ?? "").replace(/_/g, " ");
  const prettyRole = roleLabel
    ? roleLabel.charAt(0).toUpperCase() + roleLabel.slice(1)
    : "";

  return (
    <div className="page-header">
      <div className="header-wrapper row m-0">
        <div className="header-logo-wrapper col-auto p-0">
          <div className="logo-wrapper">
            <Link href="/admin/dashboard">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="img-fluid for-light"
                src="/img/frontend/logo.png"
                alt="Vishwakarma Gifts"
                style={{ maxHeight: 44 }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="img-fluid for-dark"
                src="/img/frontend/logo.png"
                alt="Vishwakarma Gifts"
                style={{ maxHeight: 44 }}
              />
            </Link>
          </div>
          <div className="toggle-sidebar">
            <svg className="sidebar-toggle">
              <use href="/backend/svg/icon-sprite.svg#stroke-animation" />
            </svg>
          </div>
        </div>

        <div className="nav-right col-xl-8 col-lg-12 col-auto pull-right right-header p-0">
          <ul className="nav-menus">
            <li className="profile-nav onhover-dropdown pe-0 py-0">
              <div className="d-flex align-items-center profile-media">
                <div className="flex-grow-1 user">
                  <span>{fullName}</span>
                  <p className="mb-0 font-nunito">
                    {prettyRole}
                    <svg>
                      <use href="/backend/svg/icon-sprite.svg#header-arrow-down" />
                    </svg>
                  </p>
                </div>
              </div>
              <ul className="profile-dropdown onhover-show-div">
                <li>
                  <Link href="/admin/settings">
                    <i data-feather="settings" />
                    <span>Account</span>
                  </Link>
                </li>
                <li>
                  <AdminLogoutButton />
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
