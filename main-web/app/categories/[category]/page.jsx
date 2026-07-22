import CategoryView from "@/components/category/CategoryView";

export default async function DynamicCategoryPage({ params }) {
  const { category } = await params;
  return <CategoryView categorySlug={category} />;
}
