import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAdminUserById } from "@/lib/queries/admin/users";
import { AdminPageHeader } from "../../_components/AdminPageHeader";

export const metadata: Metadata = { title: "User Details | Admin" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminUserViewPage({ params }: Props) {
  const { id: idStr } = await params;
  const id = Number.parseInt(idStr, 10);
  if (!Number.isFinite(id)) notFound();

  const user = await getAdminUserById(id);
  if (!user) notFound();

  return (
    <>
      <AdminPageHeader
        title="Buyers Profile"
        crumbs={[
          { label: "Users", href: "/admin/users" },
          { label: "User Details" },
        ]}
      />

      <div className="container-fluid">
        <div className="row">
          <div className="col-sm-12">
            <div className="card">
              <div className="card-header pb-0">
                <h4>
                  {user.first_name} {user.last_name}
                </h4>
              </div>
              <div className="card-body">
                <div className="table-responsive custom-scrollbar">
                  <table className="table">
                    <tbody>
                      <tr className="border-bottom-secondary">
                        <td>
                          <strong>Email</strong>
                        </td>
                        <td>{user.email}</td>
                      </tr>
                      <tr className="border-bottom-secondary">
                        <td>
                          <strong>Phone</strong>
                        </td>
                        <td>
                          {user.country_code ? `+${user.country_code} ` : ""}
                          {user.phone ?? "—"}
                        </td>
                      </tr>
                      <tr className="border-bottom-secondary">
                        <td>
                          <strong>City</strong>
                        </td>
                        <td>{user.city ?? "—"}</td>
                      </tr>
                      <tr className="border-bottom-secondary">
                        <td>
                          <strong>Status</strong>
                        </td>
                        <td>
                          {user.is_active === 1 ? (
                            <span className="badge rounded-pill badge-success p-2">
                              Active
                            </span>
                          ) : (
                            <span className="badge rounded-pill badge-danger p-2">
                              Inactive
                            </span>
                          )}
                        </td>
                      </tr>
                      <tr className="border-bottom-secondary">
                        <td>
                          <strong>Last Login</strong>
                        </td>
                        <td>
                          {user.last_login_at
                            ? new Date(user.last_login_at).toLocaleString()
                            : "Never"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
