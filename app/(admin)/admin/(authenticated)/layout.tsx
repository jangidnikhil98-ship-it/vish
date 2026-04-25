import { requireAdmin } from "@/lib/admin-auth";
import AdminHeader from "./_components/AdminHeader";
import AdminSidebar from "./_components/AdminSidebar";
import AdminFooter from "./_components/AdminFooter";
import AdminDeleteModal from "./_components/AdminDeleteModal";

/**
 * Wraps every authenticated admin page with the Pixelstrap Zono chrome:
 *
 *   <div class="page-wrapper compact-wrapper">
 *     <header />                          ← AdminHeader
 *     <div class="page-body-wrapper">
 *       <sidebar />                       ← AdminSidebar
 *       <div class="page-body">
 *         {children}
 *         <delete modal />                ← AdminDeleteModal
 *       </div>
 *     </div>
 *     <footer />                          ← AdminFooter
 *   </div>
 *
 * `requireAdmin()` runs server-side on every request to this group — if
 * the cookie is missing or the user isn't an active admin, they're
 * redirected to /admin/login before any HTML is sent.
 */
export default async function AuthenticatedAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireAdmin();

  return (
    <div className="page-wrapper compact-wrapper" id="pageWrapper">
      <AdminHeader user={user} />
      <div className="page-body-wrapper">
        <AdminSidebar />
        <div className="page-body">
          {children}
          <AdminDeleteModal />
        </div>
      </div>
      <AdminFooter />
    </div>
  );
}
