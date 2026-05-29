import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Add a new view record - increment product views and source counts directly to avoid DB bloat
export const addView = mutation({
  args: {
    productId: v.string(),
    userId: v.optional(v.id("users")),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    referrer: v.optional(v.string()),
    viewedAt: v.string(),
    sessionId: v.optional(v.string()),
    viewType: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // Find the product by its itemId using the index
      const product = await ctx.db
        .query("products")
        .withIndex("by_itemId", (q) => q.eq("itemId", args.productId))
        .first();

      if (product) {
        // Increment total views
        const newViews = (product.views || 0) + 1;

        // Referrer tracking
        let referrerKey = "direct";
        if (args.referrer) {
          try {
            const url = new URL(args.referrer);
            referrerKey = url.hostname.replace("www.", "") || "direct";
          } catch (e) {
            referrerKey = args.referrer.substring(0, 50) || "direct";
          }
        }
        // Sanitize keys to not contain dots (which aren't allowed in Convex/MongoDB keys)
        const sanitizedReferrerKey = referrerKey.replace(/\./g, "_");
        const referrerViews = { ...(product.referrerViews || {}) };
        referrerViews[sanitizedReferrerKey] = (referrerViews[sanitizedReferrerKey] || 0) + 1;

        // Search query tracking
        const searchQueryViews = { ...(product.searchQueryViews || {}) };
        if (args.searchQuery) {
          const sanitizedQuery = args.searchQuery.replace(/\./g, "_");
          searchQueryViews[sanitizedQuery] = (searchQueryViews[sanitizedQuery] || 0) + 1;
        }

        // View Type tracking
        const viewTypeViews = { ...(product.viewTypeViews || {}) };
        const viewTypeKey = (args.viewType || "product_page").replace(/\./g, "_");
        viewTypeViews[viewTypeKey] = (viewTypeViews[viewTypeKey] || 0) + 1;

        await ctx.db.patch(product._id, {
          views: newViews,
          referrerViews,
          searchQueryViews,
          viewTypeViews,
        });
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to record view:", error);
      throw new Error("Failed to record view");
    }
  },
});

// Get views for a specific product (legacy database lookup)
export const getProductViews = query({
  args: {
    productId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const views = await ctx.db
        .query("views")
        .withIndex("by_product", (q) => q.eq("productId", args.productId))
        .filter((q) => q.eq(q.field("isDeleted"), false))
        .order("desc")
        .take(args.limit || 100);

      return views;
    } catch (error) {
      return [];
    }
  },
});

// Get view statistics for a product
export const getProductViewStats = query({
  args: {
    productId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const product = await ctx.db
        .query("products")
        .withIndex("by_itemId", (q) => q.eq("itemId", args.productId))
        .first();

      const totalViews = product ? (product.views || 0) : 0;

      return {
        totalViews,
        uniqueUsers: 0,
        uniqueSessions: 0,
        recentViews: totalViews,
        viewTypes: product?.viewTypeViews || {},
        categoryViews: product?.category ? { [product.category]: totalViews } : {},
        referrerViews: product?.referrerViews || {},
        searchQueryViews: product?.searchQueryViews || {},
      };
    } catch (error) {
      return {
        totalViews: 0,
        uniqueUsers: 0,
        uniqueSessions: 0,
        recentViews: 0,
        viewTypes: {},
        categoryViews: {},
        referrerViews: {},
        searchQueryViews: {},
      };
    }
  },
});

// Get most viewed products
export const getMostViewedProducts = query({
  args: {
    limit: v.optional(v.number()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      let productsQuery = ctx.db
        .query("products")
        .filter((q) => q.neq(q.field("isDeleted"), true))
        .filter((q) => q.neq(q.field("isHidden"), true));

      if (args.category) {
        productsQuery = productsQuery.filter((q) => q.eq(q.field("category"), args.category));
      }

      const products = await productsQuery.collect();

      // Sort products by views desc (fallback to 0)
      const sortedProducts = products
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, args.limit || 8);

      return sortedProducts.map((product) => ({
        itemId: product.itemId,
        name: product.name,
        mainImage: product.mainImage,
        price: product.price,
        category: product.category,
        viewCount: product.views || 0,
        uniqueUsers: 0,
        uniqueSessions: 0,
      }));
    } catch (error) {
      console.error("getMostViewedProducts error:", error);
      return [];
    }
  },
});

// Get global trending products (all categories)
export const getGlobalTrendingProducts = query({
  args: {
    limit: v.optional(v.number()),
    daysBack: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const limit = args.limit || 10;
      
      const products = await ctx.db
        .query("products")
        .filter((q) => 
          q.and(
            q.neq(q.field("isDeleted"), true),
            q.neq(q.field("isHidden"), true)
          )
        )
        .collect();

      const sortedProducts = products
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, limit);

      return sortedProducts.map((p) => ({
        productId: p.itemId,
        productName: p.name,
        productImage: p.mainImage || '/placeholder-product.jpg',
        price: p.price,
        category: p.category,
        viewCount: p.views || 0,
        uniqueUsers: 0,
        uniqueSessions: 0,
        lastViewed: p.updatedAt || "",
      }));
    } catch (error) {
      return [];
    }
  },
});

// Get user's view history (legacy support)
export const getUserViewHistory = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const views = await ctx.db
        .query("views")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("isDeleted"), false))
        .order("desc")
        .take(args.limit || 50);

      return views;
    } catch (error) {
      return [];
    }
  },
});

// Get views by category (legacy support)
export const getViewsByCategory = query({
  args: {
    category: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const views = await ctx.db
        .query("views")
        .withIndex("by_category", (q) => q.eq("category", args.category))
        .filter((q) => q.eq(q.field("isDeleted"), false))
        .order("desc")
        .take(args.limit || 100);

      return views;
    } catch (error) {
      return [];
    }
  },
});

// Get analytics data for admin dashboard
export const getViewAnalytics = query({
  args: {
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const limit = args.limit || 10000;
      const products = await ctx.db
        .query("products")
        .filter((q) => q.neq(q.field("isDeleted"), true))
        .take(limit);

      const totalViews = products.reduce((sum, p) => sum + (p.views || 0), 0);
      const uniqueProducts = products.filter(p => (p.views || 0) > 0).length;

      const topProducts = products
        .map(p => ({ productId: p.itemId, viewCount: p.views || 0 }))
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, 10);

      return {
        totalViews,
        uniqueUsers: 0,
        uniqueSessions: 0,
        uniqueProducts,
        dailyViews: {},
        topProducts,
        viewTypeCounts: {},
        categoryCounts: {},
      };
    } catch (error) {
      return {
        totalViews: 0,
        uniqueUsers: 0,
        uniqueSessions: 0,
        uniqueProducts: 0,
        dailyViews: {},
        topProducts: [],
        viewTypeCounts: {},
        categoryCounts: {},
      };
    }
  },
});

// Soft delete a view (legacy support)
export const deleteView = mutation({
  args: {
    viewId: v.id("views"),
    deletedBy: v.id("users"),
    deletionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      await ctx.db.patch(args.viewId, {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy: args.deletedBy,
        deletionReason: args.deletionReason,
      });

      return { success: true };
    } catch (error) {
      throw new Error("Failed to delete view");
    }
  },
});

// Get view count for a specific product
export const getProductViewCount = query({
  args: {
    productId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const product = await ctx.db
        .query("products")
        .withIndex("by_itemId", (q) => q.eq("itemId", args.productId))
        .first();

      return {
        totalViews: product ? (product.views || 0) : 0,
        uniqueUsers: 0,
      };
    } catch (error) {
      return { totalViews: 0, uniqueUsers: 0 };
    }
  },
});
