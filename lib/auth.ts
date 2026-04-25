import "server-only";

import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import crypto from "node:crypto";

/* ----------------------------- Constants -------------------------------- */

const COOKIE_NAME = "vish_session";
const COOKIE_TTL_DAYS = 30;
const SECONDS_PER_DAY = 60 * 60 * 24;
const RESET_TOKEN_TTL_MINUTES = 60;
const BCRYPT_ROUNDS = 12;

const PROD = process.env.NODE_ENV === "production";

function getSigningKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Add a long random value to .env. " +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"',
    );
  }
  return new TextEncoder().encode(secret);
}

/* ----------------------------- Passwords -------------------------------- */

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string | null | undefined,
): Promise<boolean> {
  if (!hash) return false;
  // Laravel uses `$2y$…` while Node bcrypt produces `$2a$…`. They are
  // wire-compatible — bcryptjs treats them the same — so existing Laravel
  // password hashes continue to work without re-hashing.
  return bcrypt.compare(plain, hash);
}

/* --------------------------- Session (JWT cookie) ----------------------- */

export interface SessionPayload {
  /** User id */
  sub: number;
  /** Email at time of signing — handy for logs, not authoritative. */
  email: string;
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const ttl = COOKIE_TTL_DAYS * SECONDS_PER_DAY;
  const token = await new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(payload.sub))
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_TTL_DAYS}d`)
    .sign(getSigningKey());

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: PROD,
    sameSite: "lax",
    path: "/",
    maxAge: ttl,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function readSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const { payload } = await jwtVerify(raw, getSigningKey());
    if (!payload.sub) return null;
    return {
      sub: Number(payload.sub),
      email: typeof payload.email === "string" ? payload.email : "",
    };
  } catch {
    return null;
  }
}

/* --------------------------- Password reset tokens ---------------------- */

/**
 * Generate a long random reset token and the SHA-256 hash to store in the
 * DB. Only the plaintext token is sent in the reset email; storing only
 * its hash means a leaked DB cannot be used to reset passwords.
 */
export function generateResetToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString("base64url");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, hash };
}

export function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function isResetTokenExpired(createdAt: Date | null | undefined): boolean {
  if (!createdAt) return true;
  const expiresAt = createdAt.getTime() + RESET_TOKEN_TTL_MINUTES * 60_000;
  return Date.now() > expiresAt;
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
export const RESET_TOKEN_TTL_MIN = RESET_TOKEN_TTL_MINUTES;
