import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper function to get current timestamp
const nowIso = () => new Date().toISOString();

// Add item to cart
export const addToCart = mutation({
  args: {
    userId: v.id("users"),
    productId: v.string(),
    productName: v.string(),
    productImage: v.string(),
    price: v.float64(),
    size: v.string(),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if item already exists in cart for this user, product, and size
    const existingItem = await ctx.db
      .query("cart")
      .withIndex("by_user_product_size", (q) => 
        q.eq("userId", args.userId)
         .eq("productId", args.productId)
         .eq("size", args.size)
      )
      .filter(q => q.eq(q.field("isActive"), true))
      .unique();

    // Increment inCart on the product document
    const product = await ctx.db
      .query("products")
      .withIndex("by_itemId", (q) => q.eq("itemId", args.productId))
      .first();
    if (product) {
      await ctx.db.patch(product._id, {
        inCart: (product.inCart || 0) + args.quantity,
      });
    }

    if (existingItem) {
      // Update existing item quantity
      const newQuantity = existingItem.quantity + args.quantity;
      await ctx.db.patch(existingItem._id, {
        quantity: newQuantity,
        updatedAt: nowIso(),
      });
      return { 
        success: true, 
        message: "Cart item updated", 
        cartItemId: existingItem._id,
        action: "updated"
      };
    } else {
      // Create new cart item
      const cartItemId = await ctx.db.insert("cart", {
        userId: args.userId,
        productId: args.productId,
        productName: args.productName,
        productImage: args.productImage,
        price: args.price,
        size: args.size,
        quantity: args.quantity,
        addedAt: nowIso(),
        updatedAt: nowIso(),
        isActive: true,
      });
      return { 
        success: true, 
        message: "Item added to cart", 
        cartItemId,
        action: "added"
      };
    }
  },
});

// Remove item from cart
export const removeFromCart = mutation({
  args: {
    cartItemId: v.id("cart"),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.cartItemId);
    if (item && item.isActive) {
      const product = await ctx.db
        .query("products")
        .withIndex("by_itemId", (q) => q.eq("itemId", item.productId))
        .first();
      if (product) {
        await ctx.db.patch(product._id, {
          inCart: Math.max(0, (product.inCart || 0) - item.quantity),
        });
      }
    }

    await ctx.db.patch(args.cartItemId, {
      isActive: false,
      updatedAt: nowIso(),
    });
    return { success: true, message: "Item removed from cart" };
  },
});

// Update cart item quantity
export const updateCartQuantity = mutation({
  args: {
    cartItemId: v.id("cart"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.cartItemId);
    if (!item || !item.isActive) {
      throw new Error("Cart item not found or inactive");
    }

    const difference = args.quantity - item.quantity;
    if (difference !== 0) {
      const product = await ctx.db
        .query("products")
        .withIndex("by_itemId", (q) => q.eq("itemId", item.productId))
        .first();
      if (product) {
        await ctx.db.patch(product._id, {
          inCart: Math.max(0, (product.inCart || 0) + difference),
        });
      }
    }

    if (args.quantity <= 0) {
      // Remove item if quantity is 0 or negative
      await ctx.db.patch(args.cartItemId, {
        isActive: false,
        updatedAt: nowIso(),
      });
      return { success: true, message: "Item removed from cart" };
    }

    await ctx.db.patch(args.cartItemId, {
      quantity: args.quantity,
      updatedAt: nowIso(),
    });
    return { success: true, message: "Quantity updated" };
  },
});

// Get user's cart
export const getUserCart = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const cartItems = await ctx.db
      .query("cart")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter(q => q.eq(q.field("isActive"), true))
      .collect();

    // Calculate totals
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return {
      items: cartItems,
      totalItems,
      totalPrice,
      itemCount: cartItems.length,
    };
  },
});

// Get cart item by ID
export const getCartItem = query({
  args: {
    cartItemId: v.id("cart"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.cartItemId);
  },
});

// Clear user's entire cart
export const clearCart = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const cartItems = await ctx.db
      .query("cart")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter(q => q.eq(q.field("isActive"), true))
      .collect();

    // Soft delete all items and decrement products inCart
    for (const item of cartItems) {
      const product = await ctx.db
        .query("products")
        .withIndex("by_itemId", (q) => q.eq("itemId", item.productId))
        .first();
      if (product) {
        await ctx.db.patch(product._id, {
          inCart: Math.max(0, (product.inCart || 0) - item.quantity),
        });
      }
      await ctx.db.patch(item._id, {
        isActive: false,
        updatedAt: nowIso(),
      });
    }

    return { 
      success: true, 
      message: `Cleared ${cartItems.length} items from cart` 
    };
  },
});

// Get cart summary (count and total price)
export const getCartSummary = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const cartItems = await ctx.db
      .query("cart")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter(q => q.eq(q.field("isActive"), true))
      .collect();

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return {
      totalItems,
      totalPrice,
      itemCount: cartItems.length,
    };
  },
});