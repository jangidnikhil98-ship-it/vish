import type { Metadata } from "next";
import HomePage from "@/app/components/HomePage";
import { listProducts } from "@/lib/queries/products";

// ISR: page is cached at the edge and re-rendered every 60s. The actual
// DB queries are already wrapped in `unstable_cache`, so this just unlocks
// edge caching of the rendered HTML for every visitor.
// IMPORTANT: force runtime rendering. On shared hosting the DB env vars are
// often unavailable during `next build`, which can freeze this page with an
// empty bestseller section in the prerendered HTML.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vishwakarma Gifts — Personalized Wooden Engraved Gifts in India",
  description:
    "Shop personalized wooden engraved gifts online: photo frames, plaques, name boards, keychains and more. Free shipping above ₹299, fast delivery across India.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: "Vishwakarma Gifts — Personalized Wooden Engraved Gifts in India",
    description:
      "Shop personalized wooden engraved gifts online: photo frames, plaques, name boards, keychains and more.",
    images: ["/img/banner.webp"],
  },
};

import { getSetting } from "@/lib/queries/admin/settings";

const resolveImage = (img: string | null): string => {
  if (!img) return "/img/no-image.png";
  if (img.startsWith("http") || img.startsWith("/")) return img;
  return `/storage/${img}`;
};

export default async function Home() {
  let bestsellers: Array<{
    id: number;
    slug: string | null;
    name: string;
    image: string;
    price: number;
    finalPrice: number;
  }> = [];

  let newArrivals: Array<{
    id: number;
    slug: string | null;
    name: string;
    image: string;
    price: number;
    finalPrice: number;
  }> = [];

  let categories: Array<{ name: string; type: string; image: string }> = [];
  let banners: Array<{ image: string; span: string; title: string; description: string; link: string }> = [];
  let aboutHeading = "About Vishwakarma Gifts";
  let aboutContent = "";

  try {
    const [result, resultNew, catsStr, bannersStr, aboutHeadingStr, aboutContentStr] = await Promise.all([
      listProducts({ type: "bestseller", page: 1, perPage: 8 }),
      listProducts({ page: 1, perPage: 8 }),
      getSetting("home_categories"),
      getSetting("home_banners"),
      getSetting("about_heading"),
      getSetting("about_content"),
    ]);

    bestsellers = result.data.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name ?? "Product",
      image: resolveImage(r.image),
      price: r.price,
      finalPrice: r.finalPrice,
    }));

    newArrivals = resultNew.data.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name ?? "Product",
      image: resolveImage(r.image),
      price: r.price,
      finalPrice: r.finalPrice,
    }));

    categories = JSON.parse(catsStr || "[]");
    banners = JSON.parse(bannersStr || "[]");
    aboutHeading = aboutHeadingStr;
    aboutContent = aboutContentStr;
  } catch (err) {
    console.error("[home] failed to load bestsellers/newArrivals/categories/banners/about:", err);
  }

  const firstBannerImage = banners[0]?.image || "/img/banner.webp";

  return (
    <>
      {/* Preload the LCP banner image so the browser starts the fetch
          immediately on home, before HTML parsing reaches the carousel. */}
      <link
        rel="preload"
        as="image"
        href={firstBannerImage}
        fetchPriority="high"
      />
      <HomePage
        bestsellers={bestsellers}
        newArrivals={newArrivals}
        categories={categories}
        banners={banners}
        aboutHeading={aboutHeading}
        aboutContent={aboutContent}
      />
    </>
  );
}
