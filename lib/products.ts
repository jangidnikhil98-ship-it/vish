export type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image: string;
  inStock: boolean;
};

export const products: Product[] = [
  {
    id: "ganesha-idol",
    name: "Handcrafted Ganesha Idol",
    category: "Spiritual Decor",
    description: "A detailed resin idol ideal for home temples and gifting.",
    price: 1299,
    image:
      "https://images.unsplash.com/photo-1634281170265-cf74cc4f5a41?auto=format&fit=crop&w=800&q=80",
    inStock: true,
  },
  {
    id: "brass-diya-set",
    name: "Brass Diya Set (4 pcs)",
    category: "Festival Essentials",
    description: "Traditional brass diyas with a polished antique finish.",
    price: 899,
    image:
      "https://images.unsplash.com/photo-1601579111122-c55f4919d4e8?auto=format&fit=crop&w=800&q=80",
    inStock: true,
  },
  {
    id: "gift-hamper",
    name: "Premium Gift Hamper",
    category: "Corporate Gifts",
    description: "Curated hamper with sweets, dry fruits, and festive cards.",
    price: 2499,
    image:
      "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80",
    inStock: false,
  },
  {
    id: "wall-hanging",
    name: "Ethnic Wall Hanging",
    category: "Home Decor",
    description: "Colorful handcrafted wall piece made by local artisans.",
    price: 1599,
    image:
      "https://images.unsplash.com/photo-1616627453168-77ecedbc6f6d?auto=format&fit=crop&w=800&q=80",
    inStock: true,
  },
];

export const sampleCartItems = [
  { productId: "ganesha-idol", quantity: 1 },
  { productId: "brass-diya-set", quantity: 2 },
];
