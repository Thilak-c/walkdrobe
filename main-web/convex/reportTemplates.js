import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new report template
export const createReportTemplate = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    category: v.string(),
    type: v.string(),
    dataSource: v.string(),
    fields: v.array(v.object({
      name: v.string(),
      label: v.string(),
      type: v.string(),
      aggregation: v.optional(v.string()),
      format: v.optional(v.string()),
    })),
    filters: v.array(v.object({
      name: v.string(),
      label: v.string(),
      type: v.string(),
      options: v.optional(v.array(v.string())),
      required: v.boolean(),
      defaultValue: v.optional(v.any()),
    })),
    chartConfig: v.optional(v.object({
      type: v.string(),
      xAxis: v.string(),
      yAxis: v.string(),
      groupBy: v.optional(v.string()),
    })),
    permissions: v.array(v.string()),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const createdBy = args.createdBy || "mock_user";

    const templateId = await ctx.db.insert("reportTemplates", {
      name: args.name,
      description: args.description,
      category: args.category,
      type: args.type,
      dataSource: args.dataSource,
      fields: args.fields,
      filters: args.filters,
      chartConfig: args.chartConfig,
      permissions: args.permissions,
      isActive: true,
      createdBy: createdBy,
      createdAt: now,
      updatedAt: now,
    });

    return { templateId };
  },
});

// Get all report templates
export const getReportTemplates = query({
  args: {
    category: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("reportTemplates");

    // Apply filters
    if (args.category) {
      query = query.withIndex("by_category", (q) => q.eq("category", args.category));
    }

    let templates = await query.collect();

    // Filter by active status
    if (args.isActive !== undefined) {
      templates = templates.filter(t => t.isActive === args.isActive);
    }

    // For now, return all templates - permission filtering can be added later
    return templates;
  },
});

// Get a specific report template
export const getReportTemplate = query({
  args: { templateId: v.id("reportTemplates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    
    if (!template) {
      throw new Error("Template not found");
    }

    return template;
  },
});

// Update report template
export const updateReportTemplate = mutation({
  args: {
    templateId: v.id("reportTemplates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    fields: v.optional(v.array(v.object({
      name: v.string(),
      label: v.string(),
      type: v.string(),
      aggregation: v.optional(v.string()),
      format: v.optional(v.string()),
    }))),
    filters: v.optional(v.array(v.object({
      name: v.string(),
      label: v.string(),
      type: v.string(),
      options: v.optional(v.array(v.string())),
      required: v.boolean(),
      defaultValue: v.optional(v.any()),
    }))),
    chartConfig: v.optional(v.object({
      type: v.string(),
      xAxis: v.string(),
      yAxis: v.string(),
      groupBy: v.optional(v.string()),
    })),
    permissions: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    
    if (!template) {
      throw new Error("Template not found");
    }

    const updates = {
      updatedAt: new Date().toISOString(),
    };

    // Apply updates
    if (args.name) updates.name = args.name;
    if (args.description) updates.description = args.description;
    if (args.fields) updates.fields = args.fields;
    if (args.filters) updates.filters = args.filters;
    if (args.chartConfig) updates.chartConfig = args.chartConfig;
    if (args.permissions) updates.permissions = args.permissions;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.templateId, updates);

    return { success: true };
  },
});

// Delete report template
export const deleteReportTemplate = mutation({
  args: { templateId: v.id("reportTemplates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    
    if (!template) {
      throw new Error("Template not found");
    }

    // Soft delete by setting isActive to false
    await ctx.db.patch(args.templateId, {
      isActive: false,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

// Get report template categories
export const getReportCategories = query({
  args: {},
  handler: async (ctx) => {
    const templates = await ctx.db.query("reportTemplates")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const categories = [...new Set(templates.map(t => t.category))];
    
    return categories.map(category => ({
      name: category,
      count: templates.filter(t => t.category === category).length,
    }));
  },
});