import "server-only";

/**
 * Page-limit constant (mirrors Laravel `config('constant.BackendPageLimit.Limit')`).
 * Centralised so it's easy to bump.
 */
export const ADMIN_PAGE_LIMIT = 15;

export type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Parse the standard `?page=X&keyword=Y` shape that every admin index page uses.
 * Defaults page to 1 and keyword to empty string. Always returns a sane positive
 * integer for `page` (`Number.MAX_SAFE_INTEGER` is also clamped).
 */
export function readListParams(searchParams: SearchParams | undefined): {
  page: number;
  perPage: number;
  keyword: string;
} {
  const rawPage = pickFirst(searchParams?.page);
  const rawKeyword = pickFirst(searchParams?.keyword);

  const parsed = Number.parseInt(rawPage ?? "", 10);
  const page =
    Number.isFinite(parsed) && parsed >= 1 ? Math.min(parsed, 100_000) : 1;

  return {
    page,
    perPage: ADMIN_PAGE_LIMIT,
    keyword: (rawKeyword ?? "").trim(),
  };
}

function pickFirst(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

export interface ListResult<T> {
  rows: T[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export function buildListResult<T>(
  rows: T[],
  total: number,
  page: number,
  perPage: number,
): ListResult<T> {
  return {
    rows,
    page,
    perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}
