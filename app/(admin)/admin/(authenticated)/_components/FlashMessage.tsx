/**
 * Server-rendered "flash" alert that mirrors Laravel's
 *
 *   @if (session('success'))  …  @endif
 *   @if (session('error'))    …  @endif
 *
 * Reads `?success=...` / `?error=...` from search params (URL-encoded
 * messages are fine — `next/navigation` decodes them for us already).
 *
 * The Bootstrap close button works without any JS because the alert markup
 * uses `data-bs-dismiss="alert"` and `bootstrap.bundle.min.js` is loaded
 * by the admin root layout.
 */
export function FlashMessage({
  success,
  error,
}: {
  success?: string | string[];
  error?: string | string[];
}) {
  const successText = Array.isArray(success) ? success[0] : success;
  const errorText = Array.isArray(error) ? error[0] : error;

  if (!successText && !errorText) return null;

  return (
    <>
      {successText ? (
        <div
          className="alert alert-success alert-dismissible fade show"
          role="alert"
        >
          {successText}
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="alert"
            aria-label="Close"
          />
        </div>
      ) : null}

      {errorText ? (
        <div
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
          {errorText}
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="alert"
            aria-label="Close"
          />
        </div>
      ) : null}
    </>
  );
}
