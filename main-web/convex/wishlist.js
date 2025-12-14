import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper function to get current timestamp
const nowIso = () => new Date().toISOString();

// Add item to wishlist
export const addToWishlist = mutation({
  args: {
    userId: v.id("users"),
    productId: v.string(),
    productName: v.string(),
    productImage: v.string(),
    price: v.float64(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if item already exists in wishlist for this user and product
    const existingItem = await ctx.db
      .query("wishlist")
      .withIndex("by_user_product", (q) => 
        q.eq("userId", args.userId)
         .eq("productId", args.productId)
      )
      .filter(q => q.eq(q.field("isActive"), true))
      .unique();

    if (existingItem) {
      // Item already exists in wishlist
      return { 
        success: false, 
        message: "Item already in wishlist", 
        action: "already_exists"
      };
    }

    // Create new wishlist item
    const wishlistItemId = await ctx.db.insert("wishlist", {
      userId: args.userId,
      productId: args.productId,
      productName: args.productName,
      productImage: args.productImage,
      price: args.price,
      category: args.category || "",
      addedAt: nowIso(),
      isActive: true,
    });

    return { 
      success: true, 
      message: "Item added to wishlist", 
      wishlistItemId,
      action: "added"
    };
  },
});

// Remove item from wishlist
export const removeFromWishlist = mutation({
  args: {
    userId: v.id("users"),
    productId: v.string(),
  },
  handler: async (ctx, args) => {
    const existingItem = await ctx.db
      .query("wishlist")
      .withIndex("by_user_product", (q) => 
        q.eq("userId", args.userId)
         .eq("productId", args.productId)
      )
      .filter(q => q.eq(q.field("isActive"), true))
      .unique();

    if (!existingItem) {
      return { 
        success: false, 
        message: "Item not found in wishlist" 
      };
    }

    await ctx.db.patch(existingItem._id, {
      isActive: false,
    });

    return { success: true, message: "Item removed from wishlist" };
  },
});

// Toggle wishlist item (add if not exists, remove if exists)
export const toggleWishlist = mutation({
  args: {
    userId: v.id("users"),
    productId: v.string(),
    productName: v.string(),
    productImage: v.string(),
    price: v.float64(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if item already exists in wishlist
    const existingItem = await ctx.db
      .query("wishlist")
      .withIndex("by_user_product", (q) => 
        q.eq("userId", args.userId)
         .eq("productId", args.productId)
      )
      .filter(q => q.eq(q.field("isActive"), true))
      .unique();

    if (existingItem) {
      // Remove from wishlist
      await ctx.db.patch(existingItem._id, {
        isActive: false,
      });
      return { 
        success: true, 
        message: "Item removed from wishlist", 
        action: "removed",
        isWishlisted: false
      };
    } else {
      // Add to wishlist
      const wishlistItemId = await ctx.db.insert("wishlist", {
        userId: args.userId,
        productId: args.productId,
        productName: args.productName,
        productImage: args.productImage,
        price: args.price,
        category: args.category || "",
        addedAt: nowIso(),
        isActive: true,
      });
      return { 
        success: true, 
        message: "Item added to wishlist", 
        wishlistItemId,
        action: "added",
        isWishlisted: true
      };
    }
  },
});

// Get user's wishlist
export const getUserWishlist = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const wishlistItems = await ctx.db
      .query("wishlist")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter(q => q.eq(q.field("isActive"), true))
      .collect();

    return {
      items: wishlistItems,
      itemCount: wishlistItems.length,
    };
  },
});

// Check if a specific product is in user's wishlist
export const isProductWishlisted = query({
  args: {
    userId: v.id("users"),
    productId: v.string(),
  },
  handler: async (ctx, args) => {
    const wishlistItem = await ctx.db
      .query("wishlist")
      .withIndex("by_user_product", (q) => 
        q.eq("userId", args.userId)
         .eq("productId", args.productId)
      )
      .filter(q => q.eq(q.field("isActive"), true))
      .unique();

    return {
      isWishlisted: !!wishlistItem,
      wishlistItem: wishlistItem || null,
    };
  },
});

// Get wishlist summary (count)
export const getWishlistSummary = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const wishlistItems = await ctx.db
      .query("wishlist")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter(q => q.eq(q.field("isActive"), true))
      .collect();

    return {
      itemCount: wishlistItems.length,
    };
  },
});

// Clear user's entire wishlist
export const clearWishlist = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const wishlistItems = await ctx.db
      .query("wishlist")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter(q => q.eq(q.field("isActive"), true))
      .collect();

    // Soft delete all items
    for (const item of wishlistItems) {
      await ctx.db.patch(item._id, {
        isActive: false,
      });
    }

    return { 
      success: true, 
      message: `Cleared ${wishlistItems.length} items from wishlist` 
    };
  },
}); 