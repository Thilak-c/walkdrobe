import { query } from "./_generated/server";
import { v } from "convex/values";

// Dynamically query all records from any given table
export const getTableData = query({
  args: { tableName: v.string() },
  handler: async (ctx, args) => {
    // Dynamic table fetching - retrieves all fields, indexes, and nested objects
    try {
      return await ctx.db.query(args.tableName).collect();
    } catch (error) {
      console.error(`Failed to retrieve data for table ${args.tableName}:`, error);
      return [];
    }
  },
});
