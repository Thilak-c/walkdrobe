import { mutation ,query } from "./_generated/server";
import { v } from "convex/values";

export const submitReport = mutation({
  args: { userId: v.string(), message: v.string(), fileUrl: v.string() },
  handler: async (ctx, { userId, message, fileUrl }) => {
    const timestamp = Date.now();

    await ctx.db.insert("reports", {
      userId,
      message,
      fileUrl,
      createdAt: timestamp,
    });

    return { success: true };
  },
});
export const getAllReports = query({
  args: {},
  handler: async (ctx) => {
    const reports = await ctx.db.query("reports").collect();
    // Sort by newest first
    return reports.sort((a, b) => b.createdAt - a.createdAt);
  },
});