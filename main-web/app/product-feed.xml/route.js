// app/product-feed.xml/route.js
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";

export async function GET() {
  try {
    // Fetch all products from Convex
    const products = await fetchQuery(api.products.getAllProducts, { limit: 1000 });

    if (!products || products.length === 0) {
      return new Response("No products found", { status: 404 });
    }

    // Generate RSS 2.0 feed for Google Shopping
    const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>AesthetX Ways - Fashion Products</title>
    <link>https://aesthetxways.com</link>
    <description>Premium fashion and lifestyle products</description>
    ${products
      .map((product) => {
        // Calculate availability
        const totalStock = product.sizeStock
          ? Object.values(product.sizeStock).reduce((sum, stock) => sum + stock, 0)
          : 0;
        const availability = totalStock > 0 ? "in_stock" : "out_of_stock";

        // Get available sizes
        const availableSizes = product.sizeStock
          ? Object.entries(product.sizeStock)
              .filter(([_, stock]) => stock > 0)
              .map(([size]) => size)
              .join(", ")
          : "One Size";

        // Determine gender from category
        const gender = product.category?.toLowerCase().includes("women")
          ? "female"
          : product.category?.toLowerCase().includes("men")
          ? "male"
          : "unisex";

        // Determine age group
        const ageGroup = product.category?.toLowerCase().includes("kids") ? "kids" : "adult";

        // Product condition
        const condition = "new";

        return `
    <item>
      <g:id>${product.itemId}</g:id>
      <g:title>${escapeXml(product.name)}</g:title>
      <g:description>${escapeXml(
        product.description || `Premium ${product.category} - ${product.name}. Available in sizes: ${availableSizes}`
      )}</g:description>
      <g:link>https://aesthetxways.com/product/${product.itemId}</g:link>
      <g:image_link>${product.mainImage}</g:image_link>
      ${
        product.otherImages && product.otherImages.length > 0
          ? product.otherImages
              .slice(0, 10)
              .map((img) => `<g:additional_image_link>${img}</g:additional_image_link>`)
              .join("\n      ")
          : ""
      }
      <g:availability>${availability}</g:availability>
      <g:price>${product.price} INR</g:price>
      <g:brand>${escapeXml(product.brand || "AesthetX Ways")}</g:brand>
      <g:condition>${condition}</g:condition>
      <g:product_type>${escapeXml(product.category)}</g:product_type>
      <g:google_product_category>Apparel &amp; Accessories</g:google_product_category>
      <g:gender>${gender}</g:gender>
      <g:age_group>${ageGroup}</g:age_group>
      <g:color>${escapeXml(product.color || "Multiple Colors")}</g:color>
      <g:size>${escapeXml(availableSizes)}</g:size>
      <g:material>${escapeXml(product.material || "Premium Fabric")}</g:material>
      <g:item_group_id>${product.itemId.split("-")[0]}</g:item_group_id>
      <g:shipping>
        <g:country>IN</g:country>
        <g:service>Standard</g:service>
        <g:price>0 INR</g:price>
      </g:shipping>
      <g:shipping_weight>0.5 kg</g:shipping_weight>
      <g:identifier_exists>no</g:identifier_exists>
    </item>`;
      })
      .join("")}
  </channel>
</rss>`;

    return new Response(feed, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Error generating product feed:", error);
    return new Response("Error generating feed", { status: 500 });
  }
}

// Helper function to escape XML special characters
function escapeXml(unsafe) {
  if (!unsafe) return "";
  return unsafe
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
