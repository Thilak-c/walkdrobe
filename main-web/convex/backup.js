import { query } from "./_generated/server";
import { v } from "convex/values";

// Dynamically query all records from any given table using pagination to avoid the 8192 array limit
export const getTableData = query({
  args: {
    tableName: v.string(),
    cursor: v.union(v.string(), v.null()),
    numItems: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      return await ctx.db.query(args.tableName).paginate({
        numItems: args.numItems,
        cursor: args.cursor,
      });
    } catch (error) {
      console.error(`Failed to retrieve data for table ${args.tableName}:`, error);
      return { page: [], isDone: true, continueCursor: "" };
    }
  },
});
