import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth";
import { getUserById } from "@/lib/queries/users";
import DashboardShell from "./DashboardShell";
import "./dashboard.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Account",
  description: "Manage your orders, profile and saved addresses.",
  robots: { index: false, follow: false },
};

/**
 * Server-side auth guard for /dashboard/*. Anyone who hits any dashboard
 * URL without a valid session is bounced to /login with `redirect=` set
 * so they come back here right after signing in.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await readSession();
  if (!session) {
    redirect("/login?redirect=/dashboard");
  }

  const user = await getUserById(session.sub);
  if (!user || Number(user.is_active) !== 1) {
    redirect("/login?redirect=/dashboard");
  }

  return (
    <DashboardShell
      user={{
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
      }}
    >
      {children}
    </DashboardShell>
  );
}
