import { NextRequest, NextResponse } from "next/server";

/**
 * Edge proxy (formerly Next.js middleware). Bounces unauthenticated
 * requests for /admin/* to /admin/login *before* hitting any server
 * component. The (authenticated) layout still runs `requireAdmin()`
 * server-side as the source of truth (it can read the DB) — this proxy
 * just avoids spinning up the layout work when the request obviously
 * has no session at all.
 *
 * NOTE: We can only inspect the cookie's *presence* here — verifying the
 * JWT signature requires the secret, which we deliberately keep on the
 * Node runtime, not the Edge runtime. That's fine: this is a fast-path
 * pre-check, not the security boundary.
 */

const ADMIN_COOKIE = "vish_admin_session";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /admin/login itself, and the auth API routes, must always be reachable.
  if (
    pathname === "/admin/login" ||
    pathname.startsWith("/api/admin/auth/")
  ) {
    return NextResponse.next();
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const hasCookie = req.cookies.has(ADMIN_COOKIE);
    if (!hasCookie) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Run on every /admin/* and /api/admin/* request — and nothing else, so
  // we don't add overhead to the storefront.
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
