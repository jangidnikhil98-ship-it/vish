import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readAdminSession } from "@/lib/admin-auth";
import { getUserById } from "@/lib/queries/users";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  // If they're already signed in as admin, take them straight to the
  // dashboard — avoids confusing "log in again" loops.
  const session = await readAdminSession();
  if (session) {
    const user = await getUserById(session.sub);
    if (user && user.is_active && user.role === "admin") {
      redirect("/admin/dashboard");
    }
  }

  return <LoginClient />;
}
