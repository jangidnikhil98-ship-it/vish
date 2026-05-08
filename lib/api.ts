import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

const IS_PROD = process.env.NODE_ENV === "production";

/** Standard JSON success response with optional CDN cache. */
export function ok<T>(
  data: T,
  init?: { cacheSeconds?: number; staleSeconds?: number; status?: number },
): NextResponse {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (init?.cacheSeconds) {
    headers.set(
      "Cache-Control",
      `public, s-maxage=${init.cacheSeconds}, stale-while-revalidate=${
        init.staleSeconds ?? init.cacheSeconds
      }`,
    );
  } else {
    headers.set("Cache-Control", "no-store");
  }
  return new NextResponse(JSON.stringify({ success: true, data }), {
    status: init?.status ?? 200,
    headers,
  });
}

/** Standard JSON error response. */
export function fail(
  message: string,
  status = 400,
  extra?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json(
    { success: false, message, ...extra },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

/**
 * A "user-safe" error subclass — its `message` is intentionally meant to be
 * shown to the end user. Throw this when you want `handleError` to forward
 * the message verbatim instead of replacing it with a generic string.
 *
 * Usage:
 *   throw new ApiError("This coupon is no longer active.", 422);
 */
export class ApiError extends Error {
  status: number;
  extra?: Record<string, unknown>;
  constructor(message: string, status = 400, extra?: Record<string, unknown>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.extra = extra;
  }
}

/** Convert a Zod error or unknown error into a 400/500 response. */
export function handleError(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    return fail("Validation failed", 422, {
      errors: err.flatten().fieldErrors,
    });
  }
  if (err instanceof ApiError) {
    return fail(err.message, err.status, err.extra);
  }
  if (err instanceof Error) {
    console.error("[API]", err.message, IS_PROD ? "" : err.stack);
    // In production never expose the raw Error message — DB drivers, file
    // system errors, bcrypt internals etc. all leak detail an attacker can
    // use to map the schema and infrastructure.
    return fail(IS_PROD ? "Server error" : err.message || "Server error", 500);
  }
  console.error("[API] unknown error", err);
  return fail("Server error", 500);
}
