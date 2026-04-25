import Link from "next/link";

/**
 * Shared chrome for every admin list page.
 *
 * Reproduces the `card-header` + `serch-data` form + bootstrap pagination
 * partial used by every Laravel `backend.{module}.index.blade.php` so all
 * admin lists look 1:1 identical to the original Pixelstrap markup.
 *
 * Search submits as a regular GET form to `basePath`, pagination links are
 * normal anchors (no JS round-trip needed).
 */
export interface AdminListShellProps {
  /** e.g. "/admin/users" — used for the search form action and pager links */
  basePath: string;
  /** placeholder text shown inside the keyword input */
  searchPlaceholder: string;
  /** the typed-in keyword (so the box stays filled across paginations) */
  keyword: string;
  /** optional CTA on the right side, e.g. "+ Add Product" */
  createButton?: { href: string; label: string };
  /** pagination state from buildListResult */
  page: number;
  totalPages: number;
  /** preserved query string params (besides page/keyword) for pager links */
  extraParams?: Record<string, string | undefined>;
  /** rendered table body rows */
  children: React.ReactNode;
}

export function AdminListShell({
  basePath,
  searchPlaceholder,
  keyword,
  createButton,
  page,
  totalPages,
  extraParams,
  children,
}: AdminListShellProps) {
  return (
    <div className="container-fluid basic_table">
      <div className="row">
        <div className="col-sm-12">
          <div className="card">
            <div className="card-header">
              <div className="row">
                <div className="col-md-6">
                  <form
                    method="GET"
                    action={basePath}
                    className="form-horizontal"
                  >
                    <div className="input-group serch-data">
                      <input
                        type="text"
                        name="keyword"
                        defaultValue={keyword}
                        className="form-control mr-2 btn-pill search-input"
                        placeholder={searchPlaceholder}
                      />
                      <span className="input-group-btn">
                        <button
                          className="btn btn-info btn-pill"
                          type="submit"
                          title="Search"
                        >
                          <i className="fa fa-search" />
                        </button>
                      </span>
                      <Link href={basePath} className="ml-1">
                        <span className="input-group-btn">
                          <button
                            className="btn btn-danger btn-pill"
                            type="button"
                            title="Refresh page"
                          >
                            <i className="fa fa-repeat" />
                          </button>
                        </span>
                      </Link>
                    </div>
                  </form>
                </div>
                {createButton ? (
                  <div className="col-md-6">
                    <div className="card-tools">
                      <Link
                        className="btn btn-pill btn-success btn-air-success btn-air-success create-btn"
                        href={createButton.href}
                      >
                        {createButton.label}
                      </Link>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="table-responsive custom-scrollbar">
              {children}
              <Pagination
                basePath={basePath}
                keyword={keyword}
                page={page}
                totalPages={totalPages}
                extraParams={extraParams}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Pagination                                                                 */
/* -------------------------------------------------------------------------- */

function Pagination({
  basePath,
  keyword,
  page,
  totalPages,
  extraParams,
}: {
  basePath: string;
  keyword: string;
  page: number;
  totalPages: number;
  extraParams?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const buildHref = (target: number) => {
    const sp = new URLSearchParams();
    if (keyword) sp.set("keyword", keyword);
    if (extraParams) {
      for (const [k, v] of Object.entries(extraParams)) {
        if (v != null && v !== "") sp.set(k, v);
      }
    }
    sp.set("page", String(target));
    return `${basePath}?${sp.toString()}`;
  };

  // Build a windowed page list: [1, ...around current..., N]
  const window = pageWindow(page, totalPages, 5);

  return (
    <div className="pagination">
      <ul className="pagination">
        <li className={"page-item" + (page <= 1 ? " disabled" : "")}>
          {page <= 1 ? (
            <span className="page-link">«</span>
          ) : (
            <Link className="page-link" href={buildHref(page - 1)}>
              «
            </Link>
          )}
        </li>

        {window.map((p, i) =>
          p === "…" ? (
            <li key={`gap-${i}`} className="page-item disabled">
              <span className="page-link">…</span>
            </li>
          ) : (
            <li
              key={p}
              className={"page-item" + (p === page ? " active" : "")}
            >
              {p === page ? (
                <span className="page-link">{p}</span>
              ) : (
                <Link className="page-link" href={buildHref(p)}>
                  {p}
                </Link>
              )}
            </li>
          ),
        )}

        <li
          className={"page-item" + (page >= totalPages ? " disabled" : "")}
        >
          {page >= totalPages ? (
            <span className="page-link">»</span>
          ) : (
            <Link className="page-link" href={buildHref(page + 1)}>
              »
            </Link>
          )}
        </li>
      </ul>
    </div>
  );
}

function pageWindow(
  current: number,
  total: number,
  spread: number,
): Array<number | "…"> {
  const half = Math.floor(spread / 2);
  let start = Math.max(1, current - half);
  let end = Math.min(total, start + spread - 1);
  if (end - start < spread - 1) {
    start = Math.max(1, end - spread + 1);
  }

  const out: Array<number | "…"> = [];
  if (start > 1) {
    out.push(1);
    if (start > 2) out.push("…");
  }
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total) {
    if (end < total - 1) out.push("…");
    out.push(total);
  }
  return out;
}
