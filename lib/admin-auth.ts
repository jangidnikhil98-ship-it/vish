import "server-only";

import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { getUserById, type PublicUser } from "@/lib/queries/users";

/* ----------------------------- Constants -------------------------------- */

const ADMIN_COOKIE_NAME = "vish_admin_session";
const COOKIE_TTL_DAYS = 7; // shorter than the customer session by design
const SECONDS_PER_DAY = 60 * 60 * 24;

const PROD = process.env.NODE_ENV === "production";

function getSigningKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Add a long random value to .env.",
    );
  }
  // Tag the admin token with a different audience so a customer JWT can't
  // be replayed against the admin cookie name (defense in depth).
  return new TextEncoder().encode(secret + ":admin");
}

/* --------------------------- Session (JWT cookie) ----------------------- */

export interface AdminSessionPayload {
  /** User id */
  sub: number;
  email: string;
  role: string;
}

export async function createAdminSession(
  payload: AdminSessionPayload,
): Promise<void> {
  const ttl = COOKIE_TTL_DAYS * SECONDS_PER_DAY;
  const token = await new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(payload.sub))
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_TTL_DAYS}d`)
    .sign(getSigningKey());

  const jar = await cookies();
  jar.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: PROD,
    sameSite: "lax",
    path: "/",
    maxAge: ttl,
  });
}

export async function destroyAdminSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE_NAME);
}

export async function readAdminSession(): Promise<AdminSessionPayload | null> {
  const jar = await cookies();
  const raw = jar.get(ADMIN_COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const { payload } = await jwtVerify(raw, getSigningKey());
    if (!payload.sub) return null;
    return {
      sub: Number(payload.sub),
      email: typeof payload.email === "string" ? payload.email : "",
      role: typeof payload.role === "string" ? payload.role : "user",
    };
  } catch {
    return null;
  }
}

/* --------------------------- Page-level helpers ------------------------- */

/**
 * Use inside a Server Component (e.g. an admin layout or page) to require
 * the request comes from an active admin user. Redirects to /admin/login
 * if not. Returns the live user record for convenience.
 */
export async function requireAdmin(): Promise<PublicUser> {
  const session = await readAdminSession();
  if (!session) redirect("/admin/login");

  const user = await getUserById(session.sub);
  if (!user || !user.is_active || user.role !== "admin") {
    // Stale session → kill it and bounce.
    await destroyAdminSession();
    redirect("/admin/login");
  }
  return user;
}

/**
 * Same as `requireAdmin` but for use inside Route Handlers (`/api/admin/...`).
 * Returns either a typed user or a NextResponse 401 you can throw back at the
 * client.
 */
export async function requireAdminApi(): Promise<
  { ok: true; user: PublicUser } | { ok: false; response: NextResponse }
> {
  const session = await readAdminSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      ),
    };
  }
  const user = await getUserById(session.sub);
  if (!user || !user.is_active || user.role !== "admin") {
    await destroyAdminSession();
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      ),
    };
  }
  return { ok: true, user };
}

export const ADMIN_AUTH_COOKIE_NAME = ADMIN_COOKIE_NAME;
