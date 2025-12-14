import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all active collections
export const getAllCollections = query({
  args: {},
  handler: async (ctx) => {
    const collections = await ctx.db
      .query("collections")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    return collections.sort((a, b) => a.displayOrder - b.displayOrder);
  },
});

// Get collection by slug
export const getCollectionBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const collection = await ctx.db
      .query("collections")
      .filter((q) => 
        q.and(
          q.eq(q.field("slug"), args.slug),
          q.eq(q.field("isActive"), true)
        )
      )
      .first();
    
    return collection;
  },
});

// Get products for a collection
export const getCollectionProducts = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const collection = await ctx.db
      .query("collections")
      .filter((q) => 
        q.and(
          q.eq(q.field("slug"), args.slug),
          q.eq(q.field("isActive"), true)
        )
      )
      .first();

    if (!collection) {
      return [];
    }

    // Get all products
    const allProducts = await ctx.db
      .query("products")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    let products = [];

    if (collection.type === "manual") {
      // Manual collection - filter by productIds
      products = allProducts.filter((p) => 
        collection.productIds?.includes(p.itemId)
      );
    } else if (collection.type === "automatic" && collection.rules) {
      // Automatic collection - apply rules
      const rules = collection.rules;
      const now = Date.now();

      products = allProducts.filter((product) => {
        let matches = true;

        // Date range filter
        if (rules.dateRange && product.createdAt) {
          const cutoffDate = now - (rules.dateRange * 24 * 60 * 60 * 1000);
          const productDate = typeof product.createdAt === 'string' 
            ? new Date(product.createdAt).getTime() 
            : product.createdAt;
          matches = matches && productDate >= cutoffDate;
        }

        // Sales filter
        if (rules.minSales && product.salesCount) {
          matches = matches && product.salesCount >= rules.minSales;
        }

        // Views filter
        if (rules.minViews && product.views) {
          matches = matches && product.views >= rules.minViews;
        }

        // Tags filter
        if (rules.tags && rules.tags.length > 0) {
          const productTags = product.type || [];
          matches = matches && rules.tags.some(tag => productTags.includes(tag));
        }

        return matches;
      });

      // Sort products
      if (rules.sortBy) {
        products.sort((a, b) => {
          let aVal = a[rules.sortBy] || 0;
          let bVal = b[rules.sortBy] || 0;

          // Handle date strings
          if (rules.sortBy === 'createdAt') {
            aVal = typeof aVal === 'string' ? new Date(aVal).getTime() : aVal;
            bVal = typeof bVal === 'string' ? new Date(bVal).getTime() : bVal;
          }

          return rules.sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        });
      }

      // Limit results
      if (rules.limit) {
        products = products.slice(0, rules.limit);
      }
    }

    return products;
  },
});

// Create a new collection (admin only)
export const createCollection = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    type: v.string(),
    rules: v.optional(v.any()),
    productIds: v.optional(v.array(v.string())),
    displayOrder: v.number(),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const collectionId = await ctx.db.insert("collections", {
      name: args.name,
      slug: args.slug,
      description: args.description,
      type: args.type,
      rules: args.rules,
      productIds: args.productIds,
      isActive: true,
      displayOrder: args.displayOrder,
      icon: args.icon,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return collectionId;
  },
});

// Update collection
export const updateCollection = mutation({
  args: {
    collectionId: v.id("collections"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    rules: v.optional(v.any()),
    productIds: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
    displayOrder: v.optional(v.number()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { collectionId, ...updates } = args;
    
    await ctx.db.patch(collectionId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    return collectionId;
  },
});

// Delete collection
export const deleteCollection = mutation({
  args: { collectionId: v.id("collections") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.collectionId);
  },
});
