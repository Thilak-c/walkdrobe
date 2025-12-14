// Run this once to seed default collections
// You can run this from Convex dashboard or create a mutation to call it

import { mutation } from "./_generated/server";

export const seedDefaultCollections = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if collections already exist
    const existing = await ctx.db.query("collections").collect();
    if (existing.length > 0) {
      return { message: "Collections already exist", count: existing.length };
    }

    const collections = [
      {
        name: "New Arrivals",
        slug: "new-arrivals",
        description: "Discover our latest additions to the collection",
        type: "automatic",
        rules: {
          filterType: "date",
          dateRange: 30, // Last 30 days
          sortBy: "createdAt",
          sortOrder: "desc",
        },
        isActive: true,
        displayOrder: 1,
        icon: "✨",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: "Top of the Week",
        slug: "top-of-the-week",
        description: "This week's most popular items",
        type: "automatic",
        rules: {
          filterType: "views",
          dateRange: 7, // Last 7 days
          sortBy: "views",
          sortOrder: "desc",
          limit: 20,
        },
        isActive: true,
        displayOrder: 2,
        icon: "🔥",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: "Best Sellers",
        slug: "best-sellers",
        description: "Our customers' favorite products",
        type: "automatic",
        rules: {
          filterType: "sales",
          minSales: 1,
          sortBy: "salesCount",
          sortOrder: "desc",
        },
        isActive: true,
        displayOrder: 3,
        icon: "⭐",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: "Trending Now",
        slug: "trending",
        description: "What's hot right now",
        type: "automatic",
        rules: {
          filterType: "views",
          minViews: 1,
          sortBy: "views",
          sortOrder: "desc",
          limit: 30,
        },
        isActive: true,
        displayOrder: 4,
        icon: "📈",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: "Sale",
        slug: "sale",
        description: "Amazing deals you don't want to miss",
        type: "manual", // You'll manually add products on sale
        productIds: [],
        isActive: true,
        displayOrder: 5,
        icon: "💰",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const ids = [];
    for (const collection of collections) {
      const id = await ctx.db.insert("collections", collection);
      ids.push(id);
    }

    return { 
      message: "Default collections created successfully", 
      count: ids.length,
      ids 
    };
  },
});
