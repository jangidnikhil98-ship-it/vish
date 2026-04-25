import type { Metadata } from "next";
import { INDIAN_STATES } from "@/lib/constants/india";
import CheckoutClient from "./CheckoutClient";
import "./checkout.css";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Complete your purchase of personalised wooden gifts from Vishwakarma Gifts.",
  alternates: { canonical: "/checkout" },
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return <CheckoutClient states={INDIAN_STATES} />;
}
