"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Port of `resources/views/backend/includes/sidebar.blade.php`.
 * Same class names so /backend/css/style.css renders it identically.
 *
 * Active state uses `usePathname()` instead of Laravel's
 * `request()->routeIs(...)` / `request()->is(...)` helpers.
 */
export default function AdminSidebar() {
  const pathname = usePathname() || "";
  const isActive = (prefix: string) =>
    pathname === prefix || pathname.startsWith(prefix + "/");

  const cls = (prefix: string) =>
    "sidebar-link sidebar-title link-nav" +
    (isActive(prefix) ? " active-menu" : "");

  return (
    <div className="sidebar-wrapper" data-layout="stroke-svg">
      <div>
        <div className="logo-wrapper">
          <Link href="/admin/dashboard">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="img-fluid for-light"
              style={{ maxWidth: 160 }}
              src="/img/frontend/logo.png"
              alt=""
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="img-fluid for-dark"
              src="/img/frontend/logo.png"
              alt=""
            />
          </Link>
          <div className="toggle-sidebar">
            <svg className="sidebar-toggle">
              <use href="/backend/svg/icon-sprite.svg#toggle-icon" />
            </svg>
          </div>
        </div>

        <div className="logo-icon-wrapper">
          <Link href="/admin/dashboard">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="img-fluid"
              src="/img/favicon.png"
              alt="Vishwakarma Gifts"
            />
          </Link>
        </div>

        <nav className="sidebar-main">
          <div className="left-arrow" id="left-arrow">
            <i data-feather="arrow-left" />
          </div>

          <div id="sidebar-menu">
            <ul className="sidebar-links" id="simple-bar">
              <li className="back-btn">
                <Link href="/admin/dashboard">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="img-fluid"
                    src="/img/favicon.png"
                    alt="Vishwakarma Gifts"
                  />
                </Link>
                <div className="mobile-back text-end">
                  <span>Back</span>
                  <i className="fa fa-angle-right ps-2" aria-hidden="true" />
                </div>
              </li>

              <li className="sidebar-main-title">
                <div>
                  <h6 className="lan-1">General</h6>
                </div>
              </li>

              {/* Dashboard */}
              <li className="sidebar-list">
                <Link
                  className={cls("/admin/dashboard")}
                  href="/admin/dashboard"
                >
                  <svg className="stroke-icon">
                    <use href="/backend/svg/icon-sprite.svg#stroke-home" />
                  </svg>
                  <svg className="fill-icon">
                    <use href="/backend/svg/icon-sprite.svg#fill-home" />
                  </svg>
                  <span>Dashboard</span>
                  <div className="according-menu">
                    <i className="fa fa-angle-right" />
                  </div>
                </Link>
              </li>

              {/* Users */}
              <li className="sidebar-list">
                <Link className={cls("/admin/users")} href="/admin/users">
                  <svg className="stroke-icon">
                    <use href="/backend/svg/icon-sprite.svg#fill-user" />
                  </svg>
                  <svg className="fill-icon">
                    <use href="/backend/svg/icon-sprite.svg#fill-user" />
                  </svg>
                  <span>Users</span>
                  <div className="according-menu">
                    <i className="fa fa-angle-right" />
                  </div>
                </Link>
              </li>

              {/* Products */}
              <li className="sidebar-list">
                <Link
                  className={cls("/admin/products")}
                  href="/admin/products"
                >
                  <svg className="stroke-icon">
                    <use href="/backend/svg/icon-sprite.svg#stroke-ecommerce" />
                  </svg>
                  <svg className="fill-icon">
                    <use href="/backend/svg/icon-sprite.svg#stroke-ecommerce" />
                  </svg>
                  <span>Products</span>
                  <div className="according-menu">
                    <i className="fa fa-angle-right" />
                  </div>
                </Link>
              </li>

              {/* Orders */}
              <li className="sidebar-list">
                <Link className={cls("/admin/orders")} href="/admin/orders">
                  <svg className="stroke-icon">
                    <use href="/backend/svg/icon-sprite.svg#stroke-job-search" />
                  </svg>
                  <svg className="fill-icon">
                    <use href="/backend/svg/icon-sprite.svg#stroke-job-search" />
                  </svg>
                  <span>Orders</span>
                  <div className="according-menu">
                    <i className="fa fa-angle-right" />
                  </div>
                </Link>
              </li>

              {/* Transactions */}
              <li className="sidebar-list">
                <Link
                  className={cls("/admin/transactions")}
                  href="/admin/transactions"
                >
                  <svg className="stroke-icon">
                    <use href="/backend/svg/icon-sprite.svg#stroke-job-search" />
                  </svg>
                  <svg className="fill-icon">
                    <use href="/backend/svg/icon-sprite.svg#stroke-job-search" />
                  </svg>
                  <span>Transactions</span>
                  <div className="according-menu">
                    <i className="fa fa-angle-right" />
                  </div>
                </Link>
              </li>

              {/* Blogs */}
              <li className="sidebar-list">
                <Link className={cls("/admin/blogs")} href="/admin/blogs">
                  <svg className="stroke-icon">
                    <use href="/backend/svg/icon-sprite.svg#stroke-editors" />
                  </svg>
                  <svg className="fill-icon">
                    <use href="/backend/svg/icon-sprite.svg#stroke-editors" />
                  </svg>
                  <span>Blogs</span>
                  <div className="according-menu">
                    <i className="fa fa-angle-right" />
                  </div>
                </Link>
              </li>

              {/* Inquiries (Contact Us) */}
              <li className="sidebar-list">
                <Link
                  className={cls("/admin/inquiries")}
                  href="/admin/inquiries"
                >
                  <svg className="stroke-icon">
                    <use href="/backend/svg/icon-sprite.svg#stroke-editors" />
                  </svg>
                  <svg className="fill-icon">
                    <use href="/backend/svg/icon-sprite.svg#stroke-editors" />
                  </svg>
                  <span>Inquiries</span>
                  <div className="according-menu">
                    <i className="fa fa-angle-right" />
                  </div>
                </Link>
              </li>

              {/* Settings */}
              <li className="sidebar-list">
                <Link
                  className={cls("/admin/settings")}
                  href="/admin/settings"
                >
                  <svg className="stroke-icon">
                    <use href="/backend/svg/icon-sprite.svg#stroke-others" />
                  </svg>
                  <svg className="fill-icon">
                    <use href="/backend/svg/icon-sprite.svg#fill-others" />
                  </svg>
                  <span>Settings</span>
                  <div className="according-menu">
                    <i className="fa fa-angle-right" />
                  </div>
                </Link>
              </li>
            </ul>
          </div>

          <div className="right-arrow" id="right-arrow">
            <i data-feather="arrow-right" />
          </div>
        </nav>
      </div>
    </div>
  );
}
