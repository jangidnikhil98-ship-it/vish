import { NextResponse } from "next/server";
import { destroyAdminSession } from "@/lib/admin-auth";

/**
 * GET or POST /api/admin/auth/logout — clears the admin cookie.
 *
 * The original Laravel logout was a `GET` (`/admin/logout`), so we accept
 * GET as well so existing markup keeps working. Returns a redirect to
 * /admin/login for browser navigations.
 */

async function handle() {
  await destroyAdminSession();
  return NextResponse.redirect(new URL("/admin/login", baseUrl()), { status: 303 });
}

function baseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function GET() {
  return handle();
}

export async function POST() {
  return handle();
}
