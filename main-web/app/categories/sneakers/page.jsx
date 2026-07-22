import CategoryView from "@/components/category/CategoryView";

export const metadata = {
  title: "Sneakers Collection - Walkdrobe",
  description: "Discover classic lifestyle sneakers, low-tops, high-tops, and streetwear favorites.",
};

export default function SneakersCategoryPage() {
  return <CategoryView categorySlug="sneakers" />;
}
