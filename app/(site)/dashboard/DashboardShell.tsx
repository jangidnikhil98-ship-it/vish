"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/app/components/AuthProvider";

type DashboardUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
};

type NavItem = {
  href: string;
  label: string;
  icon: string;
  /** Match this href and any sub-routes (e.g. /dashboard/orders/123). */
  activeIfStartsWith?: string;
};

const NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: "fa-solid fa-gauge-high",
  },
  {
    href: "/dashboard/orders",
    label: "My Orders",
    icon: "fa-solid fa-box",
    activeIfStartsWith: "/dashboard/orders",
  },
  {
    href: "/dashboard/addresses",
    label: "Addresses",
    icon: "fa-solid fa-location-dot",
  },
  {
    href: "/dashboard/profile",
    label: "Profile",
    icon: "fa-regular fa-user",
  },
];

export default function DashboardShell({
  user,
  children,
}: {
  user: DashboardUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isActive = (item: NavItem): boolean => {
    if (item.activeIfStartsWith) {
      return pathname === item.href || pathname.startsWith(`${item.activeIfStartsWith}/`);
    }
    return pathname === item.href;
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <section className="inner-banner dashboard-banner">
        <div className="container">
          <h1>My Account</h1>
          <p>
            Welcome back, <strong>{user.firstName}</strong> — manage your
            orders, addresses and profile here.
          </p>
        </div>
      </section>

      <div className="container dashboard-container">
        <button
          type="button"
          className="dashboard-mobile-toggle"
          onClick={() => setMobileNavOpen((v) => !v)}
          aria-expanded={mobileNavOpen}
          aria-controls="dashboard-sidebar"
        >
          <i className="fa-solid fa-bars" aria-hidden="true" />
          {mobileNavOpen ? "Hide menu" : "Show menu"}
        </button>

        <div className="dashboard-grid">
          <aside
            id="dashboard-sidebar"
            className={`dashboard-sidebar ${mobileNavOpen ? "is-open" : ""}`}
          >
            <div className="dashboard-user-card">
              <div className="dashboard-avatar" aria-hidden="true">
                {(user.firstName?.[0] ?? "U").toUpperCase()}
              </div>
              <div className="dashboard-user-meta">
                <strong>
                  {user.firstName} {user.lastName}
                </strong>
                <span className="text-muted small">{user.email}</span>
              </div>
            </div>

            <nav className="dashboard-nav" aria-label="Account navigation">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={`dashboard-nav-link ${
                    isActive(item) ? "is-active" : ""
                  }`}
                >
                  <i className={item.icon} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              ))}
              <button
                type="button"
                className="dashboard-nav-link dashboard-nav-logout"
                onClick={handleLogout}
              >
                <i className="fa-solid fa-arrow-right-from-bracket" aria-hidden="true" />
                <span>Logout</span>
              </button>
            </nav>
          </aside>

          <main className="dashboard-main">{children}</main>
        </div>
      </div>
    </>
  );
}
