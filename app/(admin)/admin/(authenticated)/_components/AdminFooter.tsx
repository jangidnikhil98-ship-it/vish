/**
 * Port of `resources/views/backend/includes/footer.blade.php` — minus the
 * CKEditor jQuery snippet (we'll wire CKEditor to specific admin pages
 * that need it, not globally on every admin page).
 */
export default function AdminFooter() {
  const year = new Date().getFullYear();
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Vishwakarma Gifts";

  return (
    <footer className="footer">
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-6 p-0 footer-copyright">
            <p className="mb-0">
              Copyright {year}{" "}
              <a href="/admin/dashboard">{appName}</a>.
            </p>
          </div>
          <div className="col-md-6 p-0">
            <p className="heart mb-0">
              Hand crafted &amp; made with{" "}
              <svg className="footer-icon">
                <use href="/backend/svg/icon-sprite.svg#heart" />
              </svg>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
