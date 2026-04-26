import { readSession } from "@/lib/auth";
import { getUserById } from "@/lib/queries/users";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function DashboardProfilePage() {
  const session = await readSession();
  if (!session) return null;

  const user = await getUserById(session.sub);
  if (!user) return null;

  return (
    <div className="dashboard-card">
      <div className="dashboard-card-header">
        <h2>Profile information</h2>
      </div>

      <ProfileForm
        initial={{
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone ?? "",
        }}
      />
    </div>
  );
}
