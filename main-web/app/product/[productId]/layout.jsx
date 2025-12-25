// app/product/[productId]/layout.jsx
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";

export async function generateMetadata({ params }) {
  const { productId } = await params;

  try {
    // Fetch product data for metadata
    const product = await fetchQuery(api.products.getProductById, { productId });

    if (!product) {
      return {
        title: "Product Not Found",
        description: "The product you're looking for doesn't exist.",
      };
    }

    const productName = product.name || "Product";
    const category = product.category || "Fashion";
    const price = product.price || 0;
    const brand = product.brand || "Walkdrobe";
    const description = product.description || `Premium ${category} product - ${productName}. Available in multiple sizes with fast shipping and easy returns.`;

    return {
      title: `${productName} - ${category} | Buy Online`,
      description: `Buy ${productName} online at ₹${price}. ${description.substring(0, 150)}`,
      keywords: [productName, category, brand, "buy online", "fashion", "sneakers", "India"],
      openGraph: {
        title: `${productName} | Walkdrobe`,
        description: `${productName} - ${category}. Price: ₹${price}. ${description.substring(0, 100)}`,
        type: "website",
        siteName: "Walkdrobe",
        images: [
          {
            url: product.mainImage || "/default-product.jpg",
            width: 800,
            height: 1000,
            alt: productName,
          },
          ...(product.otherImages || []).slice(0, 3).map((img) => ({
            url: img,
            width: 800,
            height: 1000,
            alt: `${productName} - Additional Image`,
          })),
        ],
        url: `https://walkdrobe.in/product/${productId}`,
      },
      twitter: {
        card: "summary_large_image",
        title: `${productName} | Walkdrobe`,
        description: `${productName} - ${category}. Price: ₹${price}`,
        images: [product.mainImage || "/default-product.jpg"],
      },
      alternates: {
        canonical: `https://walkdrobe.in/product/${productId}`,
      },
    };
  } catch (error) {
    console.error("Error generating product metadata:", error);
    return {
      title: "Product | Walkdrobe",
      description: "Shop premium fashion and lifestyle products at Walkdrobe.",
    };
  }
}

export default function ProductLayout({ children }) {
  return children;
}
