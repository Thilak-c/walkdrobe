import CategoryView from "@/components/category/CategoryView";

export const metadata = {
  title: "Sports Shoes - Walkdrobe",
  description: "Explore performance sports shoes for running, training, and athletic excellence.",
};

export default function SportsCategoryPage() {
  return <CategoryView categorySlug="sports" />;
}
