import "server-only";

/**
 * Canonical site URL with trailing slash stripped.
 *
 * In production we refuse to fall back to localhost — emails and OAuth
 * redirects need to be the real domain. In dev, fall back to localhost:3000
 * so a fresh clone works without setting the env.
 */
export function siteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL is missing. Set it in the production environment.",
    );
  }
  return "http://localhost:3000";
}
