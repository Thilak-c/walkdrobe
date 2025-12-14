// app/product-feed.json/route.js
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";

export async function GET() {
  try {
    // Fetch all products from Convex
    const products = await fetchQuery(api.products.getAllProducts, { limit: 1000 });

    if (!products || products.length === 0) {
      return new Response(JSON.stringify({ error: "No products found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate JSON feed for Facebook/Instagram Shopping
    const feed = products.map((product) => {
      // Calculate availability
      const totalStock = product.sizeStock
        ? Object.values(product.sizeStock).reduce((sum, stock) => sum + stock, 0)
        : 0;
      const availability = totalStock > 0 ? "in stock" : "out of stock";

      // Get available sizes
      const availableSizes = product.sizeStock
        ? Object.entries(product.sizeStock)
            .filter(([_, stock]) => stock > 0)
            .map(([size]) => size)
        : ["One Size"];

      // Determine gender from category
      const gender = product.category?.toLowerCase().includes("women")
        ? "female"
        : product.category?.toLowerCase().includes("men")
        ? "male"
        : "unisex";

      return {
        id: product.itemId,
        title: product.name,
        description:
          product.description ||
          `Premium ${product.category} - ${product.name}. Available in sizes: ${availableSizes.join(", ")}`,
        availability: availability,
        condition: "new",
        price: `${product.price} INR`,
        link: `https://aesthetxways.com/product/${product.itemId}`,
        image_link: product.mainImage,
        additional_image_link: product.otherImages || [],
        brand: product.brand || "AesthetX Ways",
        google_product_category: "Apparel & Accessories",
        product_type: product.category,
        gender: gender,
        age_group: product.category?.toLowerCase().includes("kids") ? "kids" : "adult",
        color: product.color || "Multiple Colors",
        size: availableSizes.join(", "),
        material: product.material || "Premium Fabric",
        item_group_id: product.itemId.split("-")[0],
        shipping: [
          {
            country: "IN",
            service: "Standard",
            price: "0 INR",
          },
        ],
        shipping_weight: "0.5 kg",
      };
    });

    return new Response(JSON.stringify(feed, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Error generating JSON feed:", error);
    return new Response(JSON.stringify({ error: "Error generating feed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
