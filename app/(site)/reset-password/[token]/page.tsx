import type { Metadata } from "next";
import ResetPasswordClient from "./ResetPasswordClient";

export const metadata: Metadata = {
  title: "Set New Password",
  description: "Set a new password for your account.",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  return <ResetPasswordClient token={token} email={sp?.email ?? ""} />;
}
