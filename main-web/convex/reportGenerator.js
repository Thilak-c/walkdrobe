import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate a report based on template and parameters
export const generateReport = mutation({
  args: {
    templateId: v.id("reportTemplates"),
    name: v.string(),
    parameters: v.object({
      filters: v.any(),
      dateRange: v.object({
        start: v.string(),
        end: v.string(),
      }),
      groupBy: v.optional(v.string()),
      sortBy: v.optional(v.string()),
      limit: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();

    // For now, create a mock user - this should be replaced with proper auth
    const user = { _id: "mock_user", role: "admin" };

    // Get template
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // Skip permission check for now

    // Create report instance
    const reportInstanceId = await ctx.db.insert("reportInstances", {
      templateId: args.templateId,
      name: args.name,
      parameters: args.parameters,
      status: "generating",
      metadata: {
        recordCount: 0,
        generationTime: 0,
        dataSize: 0,
      },
      generatedBy: user._id,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    });

    try {
      // Generate report data based on template
      const reportData = await generateReportData(ctx, template, args.parameters);
      
      const generationTime = Date.now() - startTime;
      const dataSize = JSON.stringify(reportData).length;

      // Update report instance with data
      await ctx.db.patch(reportInstanceId, {
        status: "completed",
        data: reportData,
        metadata: {
          recordCount: reportData.length,
          generationTime,
          dataSize,
        },
      });

      return { reportInstanceId, recordCount: reportData.length };
    } catch (error) {
      // Update status to failed
      await ctx.db.patch(reportInstanceId, {
        status: "failed",
        metadata: {
          recordCount: 0,
          generationTime: Date.now() - startTime,
          dataSize: 0,
        },
      });

      throw new Error(`Report generation failed: ${error.message}`);
    }
  },
});

// Helper function to generate report data
async function generateReportData(ctx, template, parameters) {
  const { dataSource } = template;
  const { filters, dateRange, groupBy, sortBy, limit } = parameters;

  let query;
  let data = [];

  // Build query based on data source
  switch (dataSource) {
    case "orders":
      data = await generateOrdersReport(ctx, template, parameters);
      break;
    case "products":
      data = await generateProductsReport(ctx, template, parameters);
      break;
    case "users":
      data = await generateUsersReport(ctx, template, parameters);
      break;
    case "reviews":
      data = await generateReviewsReport(ctx, template, parameters);
      break;
    case "cart":
      data = await generateCartReport(ctx, template, parameters);
      break;
    default:
      throw new Error(`Unsupported data source: ${dataSource}`);
  }

  // Apply grouping if specified
  if (groupBy) {
    data = applyGrouping(data, groupBy, template.fields);
  }

  // Apply sorting
  if (sortBy) {
    data = applySorting(data, sortBy);
  }

  // Apply limit
  if (limit && limit > 0) {
    data = data.slice(0, limit);
  }

  return data;
}

// Generate orders report
async function generateOrdersReport(ctx, template, parameters) {
  const { dateRange, filters } = parameters;
  
  let query = ctx.db.query("orders");
  
  // Apply date range filter
  if (dateRange.start && dateRange.end) {
    const startTimestamp = new Date(dateRange.start).getTime();
    const endTimestamp = new Date(dateRange.end).getTime();
    
    query = query.filter((q) => 
      q.and(
        q.gte(q.field("createdAt"), startTimestamp),
        q.lte(q.field("createdAt"), endTimestamp)
      )
    );
  }

  let orders = await query.collect();

  // Apply additional filters
  if (filters) {
    if (filters.status) {
      orders = orders.filter(order => order.status === filters.status);
    }
    if (filters.minAmount) {
      orders = orders.filter(order => order.orderTotal >= filters.minAmount);
    }
    if (filters.maxAmount) {
      orders = orders.filter(order => order.orderTotal <= filters.maxAmount);
    }
  }

  // Transform data based on template fields
  return orders.map(order => transformOrderData(order, template.fields));
}

// Generate products report
async function generateProductsReport(ctx, template, parameters) {
  const { filters } = parameters;
  
  let query = ctx.db.query("products");
  let products = await query.collect();

  // Apply filters
  if (filters) {
    if (filters.category) {
      products = products.filter(product => product.category === filters.category);
    }
    if (filters.inStock !== undefined) {
      products = products.filter(product => product.inStock === filters.inStock);
    }
    if (filters.minPrice) {
      products = products.filter(product => product.price >= filters.minPrice);
    }
    if (filters.maxPrice) {
      products = products.filter(product => product.price <= filters.maxPrice);
    }
  }

  return products.map(product => transformProductData(product, template.fields));
}

// Generate users report
async function generateUsersReport(ctx, template, parameters) {
  const { dateRange, filters } = parameters;
  
  let query = ctx.db.query("users");
  let users = await query.collect();

  // Apply date range filter
  if (dateRange.start && dateRange.end) {
    users = users.filter(user => {
      const createdAt = new Date(user.createdAt);
      return createdAt >= new Date(dateRange.start) && createdAt <= new Date(dateRange.end);
    });
  }

  // Apply filters
  if (filters) {
    if (filters.role) {
      users = users.filter(user => user.role === filters.role);
    }
    if (filters.isActive !== undefined) {
      users = users.filter(user => user.isActive === filters.isActive);
    }
  }

  return users.map(user => transformUserData(user, template.fields));
}

// Generate reviews report
async function generateReviewsReport(ctx, template, parameters) {
  const { dateRange, filters } = parameters;
  
  let query = ctx.db.query("reviews");
  let reviews = await query.collect();

  // Apply date range filter
  if (dateRange.start && dateRange.end) {
    reviews = reviews.filter(review => {
      const createdAt = new Date(review.createdAt);
      return createdAt >= new Date(dateRange.start) && createdAt <= new Date(dateRange.end);
    });
  }

  // Apply filters
  if (filters) {
    if (filters.rating) {
      reviews = reviews.filter(review => review.rating === filters.rating);
    }
    if (filters.verified !== undefined) {
      reviews = reviews.filter(review => review.verified === filters.verified);
    }
  }

  return reviews.map(review => transformReviewData(review, template.fields));
}

// Generate cart report
async function generateCartReport(ctx, template, parameters) {
  const { filters } = parameters;
  
  let query = ctx.db.query("cart");
  let cartItems = await query.collect();

  // Apply filters
  if (filters) {
    if (filters.isActive !== undefined) {
      cartItems = cartItems.filter(item => item.isActive === filters.isActive);
    }
  }

  return cartItems.map(item => transformCartData(item, template.fields));
}

// Data transformation functions
function transformOrderData(order, fields) {
  const transformed = {};
  
  fields.forEach(field => {
    switch (field.name) {
      case "orderNumber":
        transformed[field.name] = order.orderNumber;
        break;
      case "orderTotal":
        transformed[field.name] = applyAggregation(order.orderTotal, field.aggregation);
        break;
      case "status":
        transformed[field.name] = order.status;
        break;
      case "createdAt":
        transformed[field.name] = formatDate(order.createdAt, field.format);
        break;
      case "itemCount":
        transformed[field.name] = order.items?.length || 0;
        break;
      case "customerEmail":
        transformed[field.name] = order.shippingDetails?.email;
        break;
      default:
        transformed[field.name] = order[field.name];
    }
  });

  return transformed;
}

function transformProductData(product, fields) {
  const transformed = {};
  
  fields.forEach(field => {
    switch (field.name) {
      case "name":
        transformed[field.name] = product.name;
        break;
      case "price":
        transformed[field.name] = applyAggregation(product.price, field.aggregation);
        break;
      case "category":
        transformed[field.name] = product.category;
        break;
      case "inStock":
        transformed[field.name] = product.inStock;
        break;
      case "totalStock":
        const totalStock = product.sizeStock ? 
          Object.values(product.sizeStock).reduce((sum, stock) => sum + (stock || 0), 0) :
          product.currentStock || 0;
        transformed[field.name] = totalStock;
        break;
      default:
        transformed[field.name] = product[field.name];
    }
  });

  return transformed;
}

function transformUserData(user, fields) {
  const transformed = {};
  
  fields.forEach(field => {
    switch (field.name) {
      case "name":
        transformed[field.name] = user.name;
        break;
      case "email":
        // Mask email for privacy
        transformed[field.name] = maskEmail(user.email);
        break;
      case "role":
        transformed[field.name] = user.role;
        break;
      case "isActive":
        transformed[field.name] = user.isActive;
        break;
      case "createdAt":
        transformed[field.name] = formatDate(user.createdAt, field.format);
        break;
      default:
        if (field.name !== "passwordHash") { // Never include password
          transformed[field.name] = user[field.name];
        }
    }
  });

  return transformed;
}

function transformReviewData(review, fields) {
  const transformed = {};
  
  fields.forEach(field => {
    switch (field.name) {
      case "rating":
        transformed[field.name] = applyAggregation(review.rating, field.aggregation);
        break;
      case "productId":
        transformed[field.name] = review.productId;
        break;
      case "userName":
        transformed[field.name] = review.userName;
        break;
      case "verified":
        transformed[field.name] = review.verified;
        break;
      case "createdAt":
        transformed[field.name] = formatDate(review.createdAt, field.format);
        break;
      default:
        transformed[field.name] = review[field.name];
    }
  });

  return transformed;
}

function transformCartData(item, fields) {
  const transformed = {};
  
  fields.forEach(field => {
    switch (field.name) {
      case "productName":
        transformed[field.name] = item.productName;
        break;
      case "price":
        transformed[field.name] = applyAggregation(item.price, field.aggregation);
        break;
      case "quantity":
        transformed[field.name] = applyAggregation(item.quantity, field.aggregation);
        break;
      case "totalValue":
        transformed[field.name] = item.price * item.quantity;
        break;
      default:
        transformed[field.name] = item[field.name];
    }
  });

  return transformed;
}

// Utility functions
function applyAggregation(value, aggregation) {
  if (!aggregation) return value;
  
  // For individual records, aggregation doesn't apply
  // This would be used in grouping operations
  return value;
}

function formatDate(dateValue, format) {
  const date = typeof dateValue === 'number' ? new Date(dateValue) : new Date(dateValue);
  
  switch (format) {
    case "short":
      return date.toLocaleDateString();
    case "long":
      return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    case "iso":
      return date.toISOString();
    default:
      return date.toLocaleDateString();
  }
}

function maskEmail(email) {
  if (!email) return "";
  const [username, domain] = email.split("@");
  const maskedUsername = username.length > 2 ? 
    username.substring(0, 2) + "*".repeat(username.length - 2) : 
    username;
  return `${maskedUsername}@${domain}`;
}

function applyGrouping(data, groupBy, fields) {
  const grouped = {};
  
  data.forEach(record => {
    const key = record[groupBy] || "Unknown";
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(record);
  });

  // Convert to array with aggregated values
  return Object.entries(grouped).map(([key, records]) => {
    const aggregated = { [groupBy]: key };
    
    fields.forEach(field => {
      if (field.aggregation && field.name !== groupBy) {
        const values = records.map(r => r[field.name]).filter(v => v !== undefined && v !== null);
        
        switch (field.aggregation) {
          case "sum":
            aggregated[field.name] = values.reduce((sum, val) => sum + (Number(val) || 0), 0);
            break;
          case "avg":
            aggregated[field.name] = values.length > 0 ? 
              values.reduce((sum, val) => sum + (Number(val) || 0), 0) / values.length : 0;
            break;
          case "count":
            aggregated[field.name] = values.length;
            break;
          case "min":
            aggregated[field.name] = values.length > 0 ? Math.min(...values.map(Number)) : 0;
            break;
          case "max":
            aggregated[field.name] = values.length > 0 ? Math.max(...values.map(Number)) : 0;
            break;
          default:
            aggregated[field.name] = values[0]; // First value
        }
      }
    });
    
    return aggregated;
  });
}

function applySorting(data, sortBy) {
  const [field, direction = "asc"] = sortBy.split(":");
  
  return data.sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];
    
    if (aVal < bVal) return direction === "asc" ? -1 : 1;
    if (aVal > bVal) return direction === "asc" ? 1 : -1;
    return 0;
  });
}

// Get report instance
export const getReportInstance = query({
  args: { reportInstanceId: v.id("reportInstances") },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportInstanceId);
    
    if (!report) {
      throw new Error("Report not found");
    }

    return report;
  },
});

// Get user's report instances
export const getUserReportInstances = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("reportInstances");
    let reports = await query.order("desc").take(args.limit || 50);

    // Filter by status if provided
    if (args.status) {
      reports = reports.filter(report => report.status === args.status);
    }

    return reports;
  },
});