import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../main-web/convex/_generated/api";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json({ success: 0, failed: 0, errors: ["CONVEX_URL not configured"] }, { status: 500 });
    }
    
    const convex = new ConvexHttpClient(convexUrl);
    const { products, store } = await request.json();

    if (!products || !Array.isArray(products)) {
      return NextResponse.json({ success: 0, failed: 0, errors: ["Invalid products data"] }, { status: 400 });
    }

    let success = 0;
    let failed = 0;
    const errors = [];

    for (const product of products) {
      try {
        // Validate required fields
        if (!product.itemId || !product.name || !product.price) {
          errors.push(`Missing required fields for product: ${product.itemId || product.name || "unknown"}`);
          failed++;
          continue;
        }

        if (store === "website") {
          // Import to website store
          // Build sizeStock if only totalStock provided
          let sizeStock = product.sizeStock || {};
          let availableSizes = product.availableSizes || [];
          
          if (Object.keys(sizeStock).length === 0 && (product.totalStock || product.currentStock)) {
            sizeStock = { "Free": Number(product.totalStock) || Number(product.currentStock) || 0 };
            availableSizes = ["Free"];
          }
          
          await convex.mutation(api.webStore.addProduct, {
            itemId: product.itemId,
            name: product.name,
            category: product.category || "Uncategorized",
            description: product.description || "",
            mainImage: product.mainImage || "",
            otherImages: product.otherImages || [],
            price: Number(product.price),
            costPrice: Number(product.costPrice) || 0,
            color: product.color || "",
            secondaryColor: product.secondaryColor || "",
            availableSizes: availableSizes,
            sizeStock: sizeStock,
          });
        } else {
          // Import to offline store (products table)
          // Build sizeStock from currentStock if not provided
          let sizeStock = product.sizeStock || {};
          let availableSizes = product.availableSizes || [];
          
          // If no sizeStock but has currentStock, create a default "Free" size
          if (Object.keys(sizeStock).length === 0 && (product.currentStock || product.totalStock)) {
            sizeStock = { "Free": Number(product.currentStock) || Number(product.totalStock) || 0 };
            availableSizes = ["Free"];
          }
          
          const currentStock = Object.values(sizeStock).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
          
          await convex.mutation(api.products.insert, {
            itemId: product.itemId,
            name: product.name,
            category: product.category || "Uncategorized",
            description: product.description || "",
            mainImage: product.mainImage || "",
            otherImages: product.otherImages || [],
            price: Number(product.price),
            costPrice: Number(product.costPrice) || 0,
            color: product.color || "",
            secondaryColor: product.secondaryColor || "",
            availableSizes: availableSizes,
            sizeStock: sizeStock,
            currentStock: currentStock,
            totalAvailable: currentStock,
            inStock: currentStock > 0,
            isDeleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
        success++;
      } catch (err) {
        errors.push(`Failed to import ${product.itemId || product.name}: ${err.message}`);
        failed++;
      }
    }

    return NextResponse.json({ success, failed, errors });
  } catch (err) {
    return NextResponse.json({ success: 0, failed: 0, errors: [err.message] }, { status: 500 });
  }
}
