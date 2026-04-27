import type { Metadata } from "next";
import Link from "next/link";
import { products, sampleCartItems } from "@/lib/products";

export const metadata: Metadata = {
  title: "Your Cart",
  description: "Review the items in your shopping cart at Vishwakarma Gifts.",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  const items = sampleCartItems
    .map((entry) => {
      const product = products.find((productItem) => productItem.id === entry.productId);
      if (!product) return null;
      return {
        ...product,
        quantity: entry.quantity,
        lineTotal: product.price * entry.quantity,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const shipping = subtotal > 2000 ? 0 : 99;
  const total = subtotal + shipping;

  return (
    <section className="grid w-full gap-8 lg:grid-cols-[2fr_1fr]">
      <div>
        <h1 className="text-3xl font-bold">Your Cart</h1>
        <p className="mt-2 text-slate-600">Review items before checkout.</p>

        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <article
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
            >
              <div>
                <h2 className="font-semibold text-slate-900">{item.name}</h2>
                <p className="text-sm text-slate-600">Qty: {item.quantity}</p>
              </div>
              <p className="font-semibold">Rs. {item.lineTotal}</p>
            </article>
          ))}
        </div>
      </div>

      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Order Summary</h2>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Subtotal</span>
            <span>Rs. {subtotal}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Shipping</span>
            <span>{shipping === 0 ? "Free" : `Rs. ${shipping}`}</span>
          </div>
          <div className="mt-2 flex justify-between border-t pt-3 text-base font-bold">
            <span>Total</span>
            <span>Rs. {total}</span>
          </div>
        </div>
        <Link
          href="/checkout"
          className="mt-5 block rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white"
        >
          Proceed to Checkout
        </Link>
      </aside>
    </section>
  );
}
