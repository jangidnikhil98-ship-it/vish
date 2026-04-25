import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAdminUserById } from "@/lib/queries/admin/users";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { FlashMessage } from "../../../_components/FlashMessage";
import { EditUserClient } from "./EditUserClient";

export const metadata: Metadata = { title: "Edit User | Admin" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}

export default async function AdminUserEditPage({
  params,
  searchParams,
}: Props) {
  const [{ id: idStr }, sp] = await Promise.all([params, searchParams]);
  const id = Number.parseInt(idStr, 10);
  if (!Number.isFinite(id)) notFound();

  const user = await getAdminUserById(id);
  if (!user) notFound();

  return (
    <>
      <AdminPageHeader
        title="Edit User Profile"
        crumbs={[
          { label: "Buyer", href: "/admin/users" },
          { label: "Edit Profile" },
        ]}
      />

      <FlashMessage success={sp.success} error={sp.error} />

      <EditUserClient
        user={{
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone ?? "",
          city: user.city ?? "",
          country_code: user.country_code ?? "",
        }}
      />
    </>
  );
}
