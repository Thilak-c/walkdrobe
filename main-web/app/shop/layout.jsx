// app/shop/layout.jsx
export const metadata = {
  title: "Shop All Footwear - Sneakers, Boots, Sandals & Formal",
  description: "Browse our complete collection of premium footwear. Shop sneakers, boots, sandals, and formal shoes. Filter by category, size, and price.",
  keywords: ["shop footwear", "buy shoes online", "sneakers", "boots", "sandals", "formal shoes", "online shopping Patna"],
  openGraph: {
    title: "Shop All Footwear | Walkdrobe",
    description: "Browse our complete collection of premium footwear at Walkdrobe.",
    type: "website",
    images: ["/og-shop.jpg"],
  },
  alternates: {
    canonical: "https://walkdrobe.in/shop",
  },
};

export default function ShopLayout({ children }) {
  return children;
}
