// convex/queries/getProductsByCategory.js
import { query } from "./_generated/server";
import { v } from "convex/values";



























// import { query } from "./_generated/server";

// Get all products (with optional filtering)
export const getAllProducts = query({
  args: {},
  handler: async (ctx) => {
    // Fetch all products from the database
    const products = await ctx.db.query("products").collect();
    
    // Filter out hidden products (optional - remove if you want to show all)
    const visibleProducts = products.filter(
      (product) => !product.isHidden
    );
    
    return visibleProducts;
  },
});

// Alternative: Get all products with pagination
export const getAllProductsPaginated = query({
  args: {
    paginationOpts: v.optional(v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    })),
  },
  handler: async (ctx, args) => {
    const options = args.paginationOpts || { numItems: 50, cursor: null };
    
    const result = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("isHidden"), false))
      .paginate(options);
    
    return result;
  },
});

// Get products by multiple subcategories
export const getProductsBySubcategories = query({
  args: {
    subcategories: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const products = await ctx.db.query("products").collect();
    
    // Normalize function for matching
    const normalize = (str) => {
      if (!str || typeof str !== 'string') return '';
      return str.toLowerCase().replace(/[-_\s]+/g, "").trim();
    };
    
    const normalizedSubs = args.subcategories.map(normalize);
    
    return products.filter((product) => {
      if (!product.subcategories || product.isHidden) return false;
      const productSubNormalized = normalize(product.subcategories);
      return normalizedSubs.includes(productSubNormalized);
    });
  },
});

// Get products by specific subcategory
export const getProductsBySubcategory = query({
  args: {
    subcategory: v.string(),
  },
  handler: async (ctx, args) => {
    const products = await ctx.db.query("products").collect();
    
    // Normalize function for better matching
    const normalize = (str) => {
      if (!str || typeof str !== 'string') return '';
      return str.toLowerCase().replace(/[-_\s]+/g, "").trim();
    };
    
    const normalizedSubcategory = normalize(args.subcategory);
    
    return products.filter((product) => {
      if (!product.subcategories || product.isHidden) return false;
      const productSubNormalized = normalize(product.subcategories);
      return productSubNormalized === normalizedSubcategory;
    });
  },
});

// Get all unique subcategories
export const getAllSubcategories = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    
    const subcategories = new Set();
    products.forEach((product) => {
      if (product.subcategories && !product.isHidden) {
        subcategories.add(product.subcategories);
      }
    });
    
    return Array.from(subcategories).sort();
  },
});






export const getProductsByCategory = query(async ({ db }, { category }) => {
  return await db
    .query("products")
    .filter(
      (p) => p.neq(p.field("isDeleted"), true) && p.eq(p.field("category"), category)
    )
    .order("desc", "createdAt")
    .collect();
});

export const getAll = query(async ({ db }) => {
  return await db
    .query("products")
    .filter((q) => q.neq(q.field("isDeleted"), true))
    .order("desc", "createdAt")
    .collect();
});