import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get current Shiprocket configuration
export const getConfig = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db.query("shiprocketConfig").first();
    if (!config) {
      // Return default values if not configured in DB yet
      return {
        length: 15,
        breadth: 10,
        height: 5,
        weight: 0.5,
        codAdvance: 0,
        codAllowCoupons: true,
      };
    }
    return {
      ...config,
      codAdvance: config.codAdvance !== undefined ? config.codAdvance : 0,
      codAllowCoupons: config.codAllowCoupons !== undefined ? config.codAllowCoupons : true,
    };
  },
});

// Update or set Shiprocket configuration
export const updateConfig = mutation({
  args: {
    length: v.number(),
    breadth: v.number(),
    height: v.number(),
    weight: v.number(),
    codAdvance: v.optional(v.number()),
    codAllowCoupons: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("shiprocketConfig").first();
    const updateData = {
      length: args.length,
      breadth: args.breadth,
      height: args.height,
      weight: args.weight,
      updatedAt: Date.now(),
    };
    if (args.codAdvance !== undefined) {
      updateData.codAdvance = args.codAdvance;
    }
    if (args.codAllowCoupons !== undefined) {
      updateData.codAllowCoupons = args.codAllowCoupons;
    }

    if (existing) {
      await ctx.db.patch(existing._id, updateData);
    } else {
      await ctx.db.insert("shiprocketConfig", {
        ...updateData,
        codAdvance: args.codAdvance !== undefined ? args.codAdvance : 0,
        codAllowCoupons: args.codAllowCoupons !== undefined ? args.codAllowCoupons : true,
      });
    }
    return { success: true };
  },
});
