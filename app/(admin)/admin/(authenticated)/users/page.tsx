import type { Metadata } from "next";
import Link from "next/link";

import { listAdminUsers } from "@/lib/queries/admin/users";
import { readListParams } from "@/lib/admin-pagination";

import { AdminListShell } from "../_components/AdminListShell";
import { AdminPageHeader } from "../_components/AdminPageHeader";
import { AdminStatusToggle } from "../_components/AdminStatusToggle";
import { AdminDeleteButton } from "../_components/AdminDeleteButton";
import { FlashMessage } from "../_components/FlashMessage";

export const metadata: Metadata = { title: "Users | Admin" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    keyword?: string;
    page?: string;
    success?: string;
    error?: string;
  }>;
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { page, perPage, keyword } = readListParams(sp);

  const result = await listAdminUsers({ page, perPage, keyword });

  return (
    <>
      <AdminPageHeader title="Users" crumbs={[{ label: "Users" }]} />

      <FlashMessage success={sp.success} error={sp.error} />

      <AdminListShell
        basePath="/admin/users"
        searchPlaceholder="Search by name, email, phone"
        keyword={keyword}
        page={result.page}
        totalPages={result.totalPages}
      >
        <table className="table userTable">
          <thead>
            <tr className="border-bottom-primary">
              <th scope="col">S.No</th>
              <th scope="col">Full Name</th>
              <th scope="col">Email</th>
              <th scope="col">Mobile</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.length === 0 ? (
              <tr className="border-bottom-secondary">
                <td colSpan={6} style={{ textAlign: "center" }}>
                  No Records Found
                </td>
              </tr>
            ) : (
              result.rows.map((u, i) => (
                <tr key={u.id} className="border-bottom-secondary jsgrid">
                  <th scope="row">{(result.page - 1) * result.perPage + i + 1}</th>
                  <td>
                    {u.first_name} {u.last_name}
                  </td>
                  <td>{u.email}</td>
                  <td>{u.phone ?? "—"}</td>
                  <td className="project-state" style={{ width: "10%" }}>
                    <AdminStatusToggle
                      endpoint={`/api/admin/users/${u.id}/status`}
                      active={u.is_active === 1}
                    />
                  </td>
                  <td className="jsgrid-cell jsgrid-control-field jsgrid-align-center">
                    <Link
                      className="btn btn-pill btn-info btn-air-info btn-air-info btn-sm"
                      href={`/admin/users/${u.id}`}
                    >
                      View
                    </Link>
                    <Link
                      className="btn btn-pill btn-secondary btn-air-secondary btn-air-secondary btn-sm"
                      href={`/admin/users/${u.id}/edit`}
                    >
                      Edit
                    </Link>
                    <AdminDeleteButton
                      endpoint={`/api/admin/users/${u.id}`}
                      label="Delete"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </AdminListShell>
    </>
  );
}
