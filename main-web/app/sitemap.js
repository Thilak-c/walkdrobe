// app/sitemap.js
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";

export default async function sitemap() {
  const baseUrl = "https://walkdrobe.in";

  // Static routes
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/offline-shops`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/track-order`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  try {
    // Fetch all products from Convex
    const products = await fetchQuery(api.products.getAllProducts, { limit: 1000 });

    // Generate product URLs
    const productRoutes = products?.map((product) => ({
      url: `${baseUrl}/product/${product.itemId}`,
      lastModified: new Date(product._creationTime || Date.now()),
      changeFrequency: "weekly",
      priority: 0.7,
    })) || [];

    // Generate collection URLs from unique categories
    const categories = [...new Set(products?.map(p => p.category) || [])];
    const collectionRoutes = categories.map((category) => ({
      url: `${baseUrl}/collections/${category.toLowerCase().replace(/\s+/g, '-')}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    // Combine all routes
    return [...staticRoutes, ...collectionRoutes, ...productRoutes];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    // Return static routes if product fetch fails
    return staticRoutes;
  }
}
