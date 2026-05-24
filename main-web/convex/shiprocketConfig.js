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
      };
    }
    return config;
  },
});

// Update or set Shiprocket configuration
export const updateConfig = mutation({
  args: {
    length: v.number(),
    breadth: v.number(),
    height: v.number(),
    weight: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("shiprocketConfig").first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        length: args.length,
        breadth: args.breadth,
        height: args.height,
        weight: args.weight,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("shiprocketConfig", {
        length: args.length,
        breadth: args.breadth,
        height: args.height,
        weight: args.weight,
        updatedAt: Date.now(),
      });
    }
    return { success: true };
  },
});
