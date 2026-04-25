import type { Metadata } from "next";

import { requireAdmin } from "@/lib/admin-auth";
import { getAdminOwnSettings } from "@/lib/queries/admin/users";
import { AdminPageHeader } from "../_components/AdminPageHeader";
import { FlashMessage } from "../_components/FlashMessage";
import { SettingsClient } from "./SettingsClient";

export const metadata: Metadata = { title: "Settings | Admin" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ success?: string; error?: string }>;
}

export default async function AdminSettingsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const me = await requireAdmin();
  const profile = await getAdminOwnSettings(me.id);

  return (
    <>
      <AdminPageHeader title="Settings" crumbs={[{ label: "Settings" }]} />
      <FlashMessage success={sp.success} error={sp.error} />

      <SettingsClient
        profile={{
          first_name: profile?.first_name ?? me.first_name,
          last_name: profile?.last_name ?? me.last_name,
          email: profile?.email ?? me.email,
          company_name: profile?.company_name ?? "",
        }}
      />
    </>
  );
}
