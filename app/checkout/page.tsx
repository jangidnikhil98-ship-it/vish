export default function CheckoutPage() {
  return (
    <section className="grid w-full gap-8 lg:grid-cols-[2fr_1fr]">
      <form className="rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="text-3xl font-bold">Checkout</h1>
        <p className="mt-2 text-slate-600">
          Enter shipping and payment details to place your order.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            First name
            <input
              type="text"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="Rahul"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Last name
            <input
              type="text"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="Sharma"
            />
          </label>
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">
            Address
            <input
              type="text"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="Street, area, landmark"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            City
            <input
              type="text"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="Bhopal"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Pincode
            <input
              type="text"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="462001"
            />
          </label>
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">
            Card number
            <input
              type="text"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="1234 5678 9012 3456"
            />
          </label>
        </div>

        <button
          type="button"
          className="mt-6 rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Place Order
        </button>
      </form>

      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Payment Info</h2>
        <ul className="mt-4 space-y-2 text-sm text-slate-600">
          <li>Secure checkout flow (demo UI)</li>
          <li>Integrate Razorpay/Stripe next</li>
          <li>Add backend order creation API</li>
        </ul>
      </aside>
    </section>
  );
}
