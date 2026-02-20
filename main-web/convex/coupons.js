// convex/coupons.js
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new coupon (Admin only)
export const createCoupon = mutation({
  args: {
    code: v.string(),
    description: v.string(),
    discountType: v.string(), // "flat" or "percentage"
    discountValue: v.number(),
    minOrderValue: v.number(),
    maxDiscount: v.optional(v.number()),
    usageLimit: v.optional(v.number()),
    perUserLimit: v.optional(v.number()),
    validFrom: v.string(),
    validUntil: v.string(),
    applicableCategories: v.optional(v.array(v.string())),
    excludedCategories: v.optional(v.array(v.string())),
    applicableProducts: v.optional(v.array(v.string())),
    paymentMethods: v.optional(v.array(v.string())),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if coupon code already exists
    const existing = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .first();

    if (existing) {
      throw new Error("Coupon code already exists");
    }

    const now = new Date().toISOString();
    const couponId = await ctx.db.insert("coupons", {
      code: args.code.toUpperCase(),
      description: args.description,
      discountType: args.discountType,
      discountValue: args.discountValue,
      minOrderValue: args.minOrderValue,
      maxDiscount: args.maxDiscount,
      usageLimit: args.usageLimit,
      usageCount: 0,
      perUserLimit: args.perUserLimit,
      validFrom: args.validFrom,
      validUntil: args.validUntil,
      isActive: true,
      applicableCategories: args.applicableCategories,
      excludedCategories: args.excludedCategories,
      applicableProducts: args.applicableProducts,
      paymentMethods: args.paymentMethods || ["upi", "card", "netbanking", "wallet"], // Default to prepaid only
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    });

    return { success: true, couponId };
  },
});

// Get all coupons (Admin)
export const getAllCoupons = query({
  args: {},
  handler: async (ctx) => {
    const coupons = await ctx.db
      .query("coupons")
      .withIndex("by_deleted", (q) => q.eq("isDeleted", false))
      .order("desc")
      .collect();

    return coupons;
  },
});

// Get active coupons
export const getActiveCoupons = query({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();
    const coupons = await ctx.db
      .query("coupons")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .filter((q) => 
        q.and(
          q.eq(q.field("isDeleted"), false),
          q.lte(q.field("validFrom"), now),
          q.gte(q.field("validUntil"), now)
        )
      )
      .collect();

    return coupons;
  },
});

// Validate and apply coupon
export const validateCoupon = query({
  args: {
    code: v.string(),
    userId: v.optional(v.id("users")),
    orderTotal: v.number(),
    paymentMethod: v.string(),
    items: v.optional(v.array(v.any())),
  },
  handler: async (ctx, args) => {
    const coupon = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .first();

    if (!coupon) {
      return { valid: false, error: "Invalid coupon code" };
    }

    if (!coupon.isActive) {
      return { valid: false, error: "Coupon is not active" };
    }

    const now = new Date().toISOString();
    if (now < coupon.validFrom) {
      return { valid: false, error: "Coupon is not yet valid" };
    }

    if (now > coupon.validUntil) {
      return { valid: false, error: "Coupon has expired" };
    }

    // Check payment method
    if (coupon.paymentMethods && !coupon.paymentMethods.includes(args.paymentMethod)) {
      return { valid: false, error: "Coupon not valid for this payment method" };
    }

    // Check minimum order value
    if (args.orderTotal < coupon.minOrderValue) {
      return { 
        valid: false, 
        error: `Minimum order value ₹${coupon.minOrderValue} required` 
      };
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return { valid: false, error: "Coupon usage limit reached" };
    }

    // Check per-user limit
    if (args.userId && coupon.perUserLimit) {
      const userUsage = await ctx.db
        .query("couponUsage")
        .withIndex("by_user_coupon", (q) => 
          q.eq("userId", args.userId).eq("couponId", coupon._id)
        )
        .collect();

      if (userUsage.length >= coupon.perUserLimit) {
        return { valid: false, error: "You have reached the usage limit for this coupon" };
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === "flat") {
      discountAmount = coupon.discountValue;
    } else if (coupon.discountType === "percentage") {
      discountAmount = Math.round((args.orderTotal * coupon.discountValue) / 100);
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    }

    return {
      valid: true,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
      },
    };
  },
});

// Record coupon usage
export const recordCouponUsage = mutation({
  args: {
    couponCode: v.string(),
    userId: v.optional(v.id("users")),
    orderNumber: v.string(),
    discountAmount: v.number(),
    orderTotal: v.number(),
  },
  handler: async (ctx, args) => {
    const coupon = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", args.couponCode.toUpperCase()))
      .first();

    if (!coupon) {
      throw new Error("Coupon not found");
    }

    // Record usage
    await ctx.db.insert("couponUsage", {
      couponId: coupon._id,
      couponCode: args.couponCode.toUpperCase(),
      userId: args.userId,
      orderNumber: args.orderNumber,
      discountAmount: args.discountAmount,
      orderTotal: args.orderTotal,
      usedAt: new Date().toISOString(),
    });

    // Increment usage count
    await ctx.db.patch(coupon._id, {
      usageCount: coupon.usageCount + 1,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

// Update coupon
export const updateCoupon = mutation({
  args: {
    couponId: v.id("coupons"),
    description: v.optional(v.string()),
    discountType: v.optional(v.string()),
    discountValue: v.optional(v.number()),
    minOrderValue: v.optional(v.number()),
    maxDiscount: v.optional(v.number()),
    usageLimit: v.optional(v.number()),
    perUserLimit: v.optional(v.number()),
    validFrom: v.optional(v.string()),
    validUntil: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    applicableCategories: v.optional(v.array(v.string())),
    excludedCategories: v.optional(v.array(v.string())),
    applicableProducts: v.optional(v.array(v.string())),
    paymentMethods: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { couponId, ...updates } = args;
    
    await ctx.db.patch(couponId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

// Delete coupon (soft delete)
export const deleteCoupon = mutation({
  args: {
    couponId: v.id("coupons"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.couponId, {
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      isActive: false,
    });

    return { success: true };
  },
});

// Get coupon usage statistics
export const getCouponStats = query({
  args: {
    couponId: v.id("coupons"),
  },
  handler: async (ctx, args) => {
    const coupon = await ctx.db.get(args.couponId);
    if (!coupon) {
      throw new Error("Coupon not found");
    }

    const usage = await ctx.db
      .query("couponUsage")
      .withIndex("by_coupon", (q) => q.eq("couponId", args.couponId))
      .collect();

    const totalDiscount = usage.reduce((sum, u) => sum + u.discountAmount, 0);
    const totalOrders = usage.length;
    const uniqueUsers = new Set(usage.map(u => u.userId).filter(Boolean)).size;

    return {
      coupon,
      stats: {
        totalUsage: totalOrders,
        uniqueUsers,
        totalDiscount,
        averageDiscount: totalOrders > 0 ? totalDiscount / totalOrders : 0,
      },
    };
  },
});
