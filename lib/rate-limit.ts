import "server-only";

/**
 * Lightweight in-process token-bucket rate limiter.
 *
 * Trade-offs:
 *   - State lives in the Node process. In a single-instance deploy (cPanel +
 *     PM2 with one worker) that's fine. With multiple workers / replicas the
 *     same client can spread its requests across processes and effectively
 *     get N× the limit. For real-world abuse mitigation in that setup, swap
 *     the Map below for Redis / @upstash/ratelimit; the public surface
 *     (rateLimit / rateLimitKey) does not change.
 *   - Buckets are evicted lazily on next call after the window expires.
 *
 * Usage:
 *   const r = rateLimit(`login:${ip}:${email}`, { limit: 5, windowMs: 15 * 60_000 });
 *   if (!r.ok) return fail("Too many attempts", 429);
 */

interface Bucket {
  count: number;
  /** Wall-clock ms when the bucket was first incremented in this window. */
  start: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** Max allowed events in the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(
  key: string,
  opts: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || now - existing.start > opts.windowMs) {
    buckets.set(key, { count: 1, start: now });
    return { ok: true, remaining: opts.limit - 1, retryAfterSeconds: 0 };
  }
  existing.count += 1;
  if (existing.count > opts.limit) {
    const retryAfterMs = opts.windowMs - (now - existing.start);
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }
  return {
    ok: true,
    remaining: opts.limit - existing.count,
    retryAfterSeconds: 0,
  };
}

/**
 * Extract a stable client identifier from the request. Prefers
 * `x-forwarded-for` (cPanel / nginx / Cloudflare set this) then `x-real-ip`,
 * then a fallback bucket so we still rate-limit something useful.
 */
export function rateLimitKey(req: Request, fallback = "unknown"): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim() || fallback;
  const xri = req.headers.get("x-real-ip");
  if (xri) return xri.trim() || fallback;
  return fallback;
}

/**
 * Evict every bucket — used by tests. Not exported via lib index.
 */
export function _resetRateLimitForTests(): void {
  buckets.clear();
}
