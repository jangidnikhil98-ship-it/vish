import type { Metadata } from "next";
import CartClient from "./CartClient";

export const metadata: Metadata = {
  title: "Your Cart | Vishwakarma Gifts",
  description: "Review the items in your shopping cart at Vishwakarma Gifts.",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <div className="bg-[#fcf9f5] min-h-screen">
      <CartClient />
    </div>
  );
}
