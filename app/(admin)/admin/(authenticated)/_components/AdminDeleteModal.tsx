"use client";

import { useEffect } from "react";

/**
 * Port of `resources/views/backend/layouts/modal.blade.php`.
 *
 * Other admin pages can show this modal by:
 *   1. Setting `data-url` on the `#confirmDelete` button
 *   2. Triggering Bootstrap's modal show on `#deleteModal`
 *
 * On confirm, the page is navigated to the URL. This matches the original
 * Blade behaviour exactly.
 */
export default function AdminDeleteModal() {
  useEffect(() => {
    function handleConfirm(this: HTMLButtonElement) {
      const url = this.getAttribute("data-url");
      if (url) window.location.href = url;
    }
    const btn = document.getElementById(
      "confirmDelete",
    ) as HTMLButtonElement | null;
    btn?.addEventListener("click", handleConfirm);
    return () => btn?.removeEventListener("click", handleConfirm);
  }, []);

  return (
    <div
      className="modal fade"
      id="deleteModal"
      tabIndex={-1}
      aria-labelledby="deleteModal"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          <div className="modal-body">
            <div className="modal-toggle-wrapper">
              <ul className="modal-img">
                <li>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/backend/images/gif/danger.gif"
                    alt="error"
                  />
                </li>
              </ul>
              <h4 className="text-center pb-2">
                Are you sure you want to delete this?
              </h4>
              <p className="text-center">
                Do you want to proceed with deleting this?
              </p>
              <div className="modal-footer">
                <button
                  className="btn btn-danger"
                  id="confirmDelete"
                  type="button"
                >
                  Yes, Delete
                </button>
                <button
                  className="btn btn-primary"
                  type="button"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
