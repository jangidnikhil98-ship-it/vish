import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

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

/** Convert a Zod error or unknown error into a 400/500 response. */
export function handleError(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    return fail("Validation failed", 422, {
      errors: err.flatten().fieldErrors,
    });
  }
  if (err instanceof Error) {
    console.error("[API]", err.message, err.stack);
    return fail(err.message || "Server error", 500);
  }
  console.error("[API] unknown error", err);
  return fail("Server error", 500);
}
