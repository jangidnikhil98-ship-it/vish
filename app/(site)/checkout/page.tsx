import type { Metadata } from "next";
import { INDIAN_STATES } from "@/lib/constants/india";
import { getCheckoutSettings } from "@/lib/queries/admin/settings";
import CheckoutClient from "./CheckoutClient";
import "./checkout.css";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Complete your purchase of personalised wooden gifts from Vishwakarma Gifts.",
  alternates: { canonical: "/checkout" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const checkout = await getCheckoutSettings();
  return (
    <CheckoutClient
      states={INDIAN_STATES}
      settings={{
        codEnabled: checkout.codEnabled,
        codFee: checkout.codFee,
        defaultShippingFee: checkout.defaultShippingFee,
      }}
    />
  );
}
