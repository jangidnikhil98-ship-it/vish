import type { Metadata } from "next";
import HomePage from "@/app/components/HomePage";
import { getBestsellers, type ProductCard } from "@/lib/queries/products";

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

const resolveImage = (img: string | null): string => {
  if (!img) return "/img/no-image.png";
  if (img.startsWith("http") || img.startsWith("/")) return img;
  return `/storage/${img}`;
};

export default async function Home() {
  let bestsellers: Array<{
    slug: string;
    name: string;
    image: string;
    price: number;
    finalPrice: number;
  }> = [];

  try {
    const rows: ProductCard[] = await getBestsellers(8);
    bestsellers = rows
      .filter((r) => r.slug)
      .map((r) => ({
        slug: r.slug as string,
        name: r.name ?? "Product",
        image: resolveImage(r.image),
        price: r.price,
        finalPrice: r.finalPrice,
      }));
  } catch (err) {
    console.error("[home] failed to load bestsellers:", err);
  }

  return <HomePage bestsellers={bestsellers} />;
}
