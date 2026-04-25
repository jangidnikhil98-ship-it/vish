import { products } from "@/lib/products";

export default function ProductsPage() {
  return (
    <section className="w-full">
      <h1 className="text-3xl font-bold">Products</h1>
      <p className="mt-2 text-slate-600">
        Browse the catalog and add your favorites to cart.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <article
            key={product.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs uppercase text-slate-500">{product.category}</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              {product.name}
            </h2>
            <p className="mt-2 text-sm text-slate-600">{product.description}</p>
            <div className="mt-5 flex items-center justify-between">
              <p className="text-base font-bold text-slate-900">
                Rs. {product.price}
              </p>
              <button
                type="button"
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={!product.inStock}
              >
                {product.inStock ? "Add to cart" : "Out of stock"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
