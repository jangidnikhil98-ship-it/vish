/**
 * Server-safe helper shared between the server page (edit) and the
 * client form. Lives in a plain .ts module (no "use client") so Next.js
 * lets the server call it directly.
 */

/** Convert a JS Date or null to the value expected by `<input type="datetime-local">`. */
export function toDateTimeLocal(d: Date | null | undefined): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}
