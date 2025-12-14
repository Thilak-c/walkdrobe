import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Create sample report templates
export const createSampleTemplates = mutation({
  args: { adminUserId: v.id("users") },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    // Sales Performance Report
    await ctx.db.insert("reportTemplates", {
      name: "Sales Performance Report",
      description: "Comprehensive analysis of sales metrics including revenue, order count, and growth trends",
      category: "sales",
      type: "analytical",
      dataSource: "orders",
      fields: [
        { name: "orderNumber", label: "Order Number", type: "string" },
        { name: "orderTotal", label: "Order Total", type: "currency", aggregation: "sum" },
        { name: "status", label: "Status", type: "string" },
        { name: "createdAt", label: "Order Date", type: "date", format: "short" },
        { name: "customerEmail", label: "Customer", type: "string" },
        { name: "itemCount", label: "Items", type: "number", aggregation: "sum" },
      ],
      filters: [
        { name: "status", label: "Order Status", type: "select", options: ["pending", "confirmed", "shipped", "delivered", "cancelled"], required: false },
        { name: "minAmount", label: "Minimum Amount", type: "number", required: false },
        { name: "maxAmount", label: "Maximum Amount", type: "number", required: false },
      ],
      chartConfig: {
        type: "bar",
        xAxis: "createdAt",
        yAxis: "orderTotal",
        groupBy: "status",
      },
      permissions: ["admin", "super_admin", "manager"],
      isActive: true,
      createdBy: args.adminUserId,
      createdAt: now,
      updatedAt: now,
    });

    // Product Inventory Report
    await ctx.db.insert("reportTemplates", {
      name: "Product Inventory Report",
      description: "Track product stock levels, categories, and pricing information",
      category: "inventory",
      type: "detailed",
      dataSource: "products",
      fields: [
        { name: "name", label: "Product Name", type: "string" },
        { name: "category", label: "Category", type: "string" },
        { name: "price", label: "Price", type: "currency" },
        { name: "totalStock", label: "Total Stock", type: "number", aggregation: "sum" },
        { name: "inStock", label: "In Stock", type: "string" },
      ],
      filters: [
        { name: "category", label: "Category", type: "select", options: ["clothing", "accessories", "shoes", "bags"], required: false },
        { name: "inStock", label: "Stock Status", type: "select", options: ["true", "false"], required: false },
        { name: "minPrice", label: "Minimum Price", type: "number", required: false },
        { name: "maxPrice", label: "Maximum Price", type: "number", required: false },
      ],
      chartConfig: {
        type: "pie",
        xAxis: "category",
        yAxis: "totalStock",
      },
      permissions: ["admin", "super_admin", "manager", "analyst"],
      isActive: true,
      createdBy: args.adminUserId,
      createdAt: now,
      updatedAt: now,
    });

    // Customer Analytics Report
    await ctx.db.insert("reportTemplates", {
      name: "Customer Analytics Report",
      description: "Analyze customer registration trends, activity levels, and user demographics",
      category: "customers",
      type: "analytical",
      dataSource: "users",
      fields: [
        { name: "name", label: "Customer Name", type: "string" },
        { name: "email", label: "Email", type: "string" },
        { name: "role", label: "Role", type: "string" },
        { name: "isActive", label: "Active Status", type: "string" },
        { name: "createdAt", label: "Registration Date", type: "date", format: "short" },
      ],
      filters: [
        { name: "role", label: "User Role", type: "select", options: ["user", "admin", "super_admin"], required: false },
        { name: "isActive", label: "Active Status", type: "select", options: ["true", "false"], required: false },
      ],
      chartConfig: {
        type: "line",
        xAxis: "createdAt",
        yAxis: "count",
        groupBy: "role",
      },
      permissions: ["admin", "super_admin"],
      isActive: true,
      createdBy: args.adminUserId,
      createdAt: now,
      updatedAt: now,
    });

    // Product Reviews Report
    await ctx.db.insert("reportTemplates", {
      name: "Product Reviews Report",
      description: "Monitor product ratings, review trends, and customer feedback",
      category: "marketing",
      type: "summary",
      dataSource: "reviews",
      fields: [
        { name: "productId", label: "Product ID", type: "string" },
        { name: "userName", label: "Reviewer", type: "string" },
        { name: "rating", label: "Rating", type: "number", aggregation: "avg" },
        { name: "verified", label: "Verified Purchase", type: "string" },
        { name: "createdAt", label: "Review Date", type: "date", format: "short" },
      ],
      filters: [
        { name: "rating", label: "Rating", type: "select", options: ["1", "2", "3", "4", "5"], required: false },
        { name: "verified", label: "Verified Only", type: "select", options: ["true", "false"], required: false },
      ],
      chartConfig: {
        type: "bar",
        xAxis: "rating",
        yAxis: "count",
      },
      permissions: ["admin", "super_admin", "manager", "analyst"],
      isActive: true,
      createdBy: args.adminUserId,
      createdAt: now,
      updatedAt: now,
    });

    // Cart Abandonment Report
    await ctx.db.insert("reportTemplates", {
      name: "Cart Abandonment Report",
      description: "Analyze shopping cart behavior and abandonment patterns",
      category: "marketing",
      type: "analytical",
      dataSource: "cart",
      fields: [
        { name: "productName", label: "Product", type: "string" },
        { name: "price", label: "Price", type: "currency", aggregation: "avg" },
        { name: "quantity", label: "Quantity", type: "number", aggregation: "sum" },
        { name: "totalValue", label: "Total Value", type: "currency", aggregation: "sum" },
        { name: "addedAt", label: "Added Date", type: "date", format: "short" },
      ],
      filters: [
        { name: "isActive", label: "Cart Status", type: "select", options: ["true", "false"], required: false },
      ],
      chartConfig: {
        type: "line",
        xAxis: "addedAt",
        yAxis: "totalValue",
      },
      permissions: ["admin", "super_admin", "manager"],
      isActive: true,
      createdBy: args.adminUserId,
      createdAt: now,
      updatedAt: now,
    });

    // Daily Sales Summary
    await ctx.db.insert("reportTemplates", {
      name: "Daily Sales Summary",
      description: "Quick overview of daily sales performance and key metrics",
      category: "sales",
      type: "summary",
      dataSource: "orders",
      fields: [
        { name: "orderTotal", label: "Revenue", type: "currency", aggregation: "sum" },
        { name: "orderNumber", label: "Order Count", type: "number", aggregation: "count" },
        { name: "itemCount", label: "Items Sold", type: "number", aggregation: "sum" },
        { name: "status", label: "Status", type: "string" },
      ],
      filters: [
        { name: "status", label: "Order Status", type: "multiselect", options: ["confirmed", "shipped", "delivered"], required: false },
      ],
      chartConfig: {
        type: "bar",
        xAxis: "status",
        yAxis: "orderTotal",
      },
      permissions: ["admin", "super_admin", "manager", "analyst"],
      isActive: true,
      createdBy: args.adminUserId,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, message: "Sample templates created successfully" };
  },
});