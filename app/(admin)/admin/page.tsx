import { redirect } from "next/navigation";

/**
 * `/admin` → bounce to /admin/dashboard. Auth check happens inside the
 * (authenticated) layout, so unauthenticated visitors get to /admin/login.
 */
export default function AdminIndex() {
  redirect("/admin/dashboard");
}
