import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Count how many unique users today
export const getDailyCount = query({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().slice(0, 10);
    const users = await ctx.db.query("dailyAccess")
      .filter(q => q.eq(q.field("date"), today))
      .collect();
    return users.length;
  },
});

// Request access
export const requestAccess = mutation({
  args: { userIdV   : v.string() },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().slice(0, 10);

    // Already has access today?
    const existing = await ctx.db.query("dailyAccess")
      .filter(q => q.eq(q.field("userIdV"), args.userIdV))
      .filter(q => q.eq(q.field("date"), today))
      .first();

    if (existing) return { success: true };

    // Count today
    const count = await ctx.db.query("dailyAccess")
      .filter(q => q.eq(q.field("date"), today))
      .collect();

    if (count.length >= 500) {
      return { success: false };
    }

    // ✅ Correct insert
    await ctx.db.insert("dailyAccess", {
      userIdV: args.userIdV,
      date: today,
    });

    return { success: true };
  },
});
