import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const nowIso = () => new Date().toISOString();

// ============ OFFLINE PRODUCTS CRUD ============

export const addProduct = mutation({
  args: {
    itemId: v.string(),
    name: v.string(),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    mainImage: v.string(),
    otherImages: v.optional(v.array(v.string())),
    price: v.float64(),
    costPrice: v.optional(v.float64()),
    color: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    availableSizes: v.array(v.string()),
    sizeStock: v.any(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("off_products")
      .withIndex("by_itemId", q => q.eq("itemId", args.itemId))
      .first();
    if (existing) throw new Error("Product with this SKU already exists");

    const totalStock = Object.values(args.sizeStock).reduce((sum, qty) => sum + (qty || 0), 0);

    const id = await ctx.db.insert("off_products", {
      itemId: args.itemId,
      name: args.name,
      category: args.category || "",
      description: args.description || "",
      mainImage: args.mainImage,
      otherImages: args.otherImages || [],
      price: args.price,
      costPrice: args.costPrice || 0,
      color: args.color || "",
      secondaryColor: args.secondaryColor || "",
      availableSizes: args.availableSizes,
      sizeStock: args.sizeStock,
      totalStock,
      inStock: totalStock > 0,
      isHidden: false,
      isDeleted: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });

    await ctx.db.insert("off_movements", {
      productId: args.itemId,
      productName: args.name,
      type: "stock_in",
      quantity: totalStock,
      previousStock: 0,
      newStock: totalStock,
      reason: "Initial stock",
      sizeDetails: args.sizeStock,
      createdAt: nowIso(),
      createdBy: "admin",
    });

    return { success: true, id };
  },
});

export const updateProduct = mutation({
  args: {
    id: v.id("off_products"),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    mainImage: v.optional(v.string()),
    price: v.optional(v.float64()),
    costPrice: v.optional(v.float64()),
    color: v.optional(v.string()),
    isHidden: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...updates }) => {
    const filtered = Object.fromEntries(Object.entries(updates).filter(([_, v]) => v !== undefined));
    await ctx.db.patch(id, { ...filtered, updatedAt: nowIso() });
    return { success: true };
  },
});

export const updateStock = mutation({
  args: {
    id: v.id("off_products"),
    sizeStock: v.any(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { id, sizeStock, reason }) => {
    const product = await ctx.db.get(id);
    if (!product) throw new Error("Product not found");

    const oldStock = product.totalStock;
    const newStock = Object.values(sizeStock).reduce((sum, qty) => sum + (qty || 0), 0);

    await ctx.db.patch(id, {
      sizeStock,
      totalStock: newStock,
      inStock: newStock > 0,
      updatedAt: nowIso(),
    });

    await ctx.db.insert("off_movements", {
      productId: product.itemId,
      productName: product.name,
      type: newStock > oldStock ? "stock_in" : "stock_out",
      quantity: Math.abs(newStock - oldStock),
      previousStock: oldStock,
      newStock,
      reason: reason || "Stock update",
      sizeDetails: sizeStock,
      createdAt: nowIso(),
      createdBy: "admin",
    });

    return { success: true, oldStock, newStock };
  },
});

// Move product to trash (not permanent delete)
export const deleteProduct = mutation({
  args: { id: v.id("off_products") },
  handler: async (ctx, { id }) => {
    const product = await ctx.db.get(id);
    if (!product) throw new Error("Product not found");

    // Save to trash
    await ctx.db.insert("off_trash", {
      originalId: id,
      itemId: product.itemId,
      name: product.name,
      productData: product,
      deletedAt: nowIso(),
      deletedBy: "admin",
    });

    // Delete from products
    await ctx.db.delete(id);

    return { success: true };
  },
});

// Restore product from trash
export const restoreProduct = mutation({
  args: { trashId: v.id("off_trash") },
  handler: async (ctx, { trashId }) => {
    const trashItem = await ctx.db.get(trashId);
    if (!trashItem) throw new Error("Trash item not found");

    // Check if itemId already exists
    const existing = await ctx.db.query("off_products")
      .withIndex("by_itemId", q => q.eq("itemId", trashItem.itemId))
      .first();
    if (existing) throw new Error("Product with this SKU already exists");

    // Restore product
    const { _id, _creationTime, isDeleted, ...productData } = trashItem.productData;
    await ctx.db.insert("off_products", {
      ...productData,
      isDeleted: false,
      updatedAt: nowIso(),
    });

    // Remove from trash
    await ctx.db.delete(trashId);

    return { success: true };
  },
});

// Get all trash items
export const getTrash = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("off_trash").order("desc").collect();
  },
});

// ============ QUERIES ============

export const getAllProducts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("off_products")
      .filter(q => q.neq(q.field("isDeleted"), true))
      .order("desc")
      .collect();
  },
});

export const getProduct = query({
  args: { id: v.id("off_products") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const getProductByItemId = query({
  args: { itemId: v.string() },
  handler: async (ctx, { itemId }) => {
    return await ctx.db.query("off_products")
      .withIndex("by_itemId", q => q.eq("itemId", itemId))
      .first();
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("off_products")
      .filter(q => q.neq(q.field("isDeleted"), true))
      .collect();

    const stats = {
      totalProducts: products.length,
      totalStock: 0,
      inStock: 0,
      lowStock: 0,
      outOfStock: 0,
      totalValue: 0,
      totalCost: 0,
      categories: {},
    };

    products.forEach(p => {
      stats.totalStock += p.totalStock;
      stats.totalValue += p.totalStock * p.price;
      stats.totalCost += p.totalStock * (p.costPrice || 0);

      if (p.totalStock === 0) stats.outOfStock++;
      else if (p.totalStock <= 10) stats.lowStock++;
      else stats.inStock++;

      const cat = p.category || "Uncategorized";
      if (!stats.categories[cat]) stats.categories[cat] = { count: 0, stock: 0 };
      stats.categories[cat].count++;
      stats.categories[cat].stock += p.totalStock;
    });

    stats.potentialProfit = stats.totalValue - stats.totalCost;
    return stats;
  },
});

export const getLowStock = query({
  args: { threshold: v.optional(v.number()) },
  handler: async (ctx, { threshold = 10 }) => {
    const products = await ctx.db.query("off_products")
      .filter(q => q.neq(q.field("isDeleted"), true))
      .collect();
    return products.filter(p => p.totalStock <= threshold).sort((a, b) => a.totalStock - b.totalStock);
  },
});

export const getMovements = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 50 }) => {
    return await ctx.db.query("off_movements").order("desc").take(limit);
  },
});

export const searchProducts = query({
  args: { query: v.string() },
  handler: async (ctx, { query }) => {
    const products = await ctx.db.query("off_products")
      .filter(q => q.neq(q.field("isDeleted"), true))
      .collect();
    const s = query.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(s) || 
      p.itemId.toLowerCase().includes(s) ||
      (p.category || "").toLowerCase().includes(s)
    );
  },
});

// ============ BILLING ============

export const createBill = mutation({
  args: {
    items: v.array(v.object({
      productId: v.string(),
      productName: v.string(),
      productImage: v.optional(v.string()),
      itemId: v.string(),
      size: v.string(),
      price: v.float64(),
      quantity: v.number(),
    })),
    customerName: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    subtotal: v.float64(),
    discount: v.optional(v.float64()),
    tax: v.float64(),
    total: v.float64(),
    paymentMethod: v.string(),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const date = new Date();
    const billNumber = `OFF${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}${String(date.getSeconds()).padStart(2, "0")}`;

    // Deduct stock for each item
    for (const item of args.items) {
      const product = await ctx.db.query("off_products")
        .withIndex("by_itemId", q => q.eq("itemId", item.itemId))
        .first();
      
      if (product) {
        const sizeStock = { ...product.sizeStock };
        sizeStock[item.size] = Math.max(0, (sizeStock[item.size] || 0) - item.quantity);
        const newTotal = Object.values(sizeStock).reduce((sum, qty) => sum + (qty || 0), 0);

        await ctx.db.patch(product._id, {
          sizeStock,
          totalStock: newTotal,
          inStock: newTotal > 0,
          updatedAt: nowIso(),
        });

        await ctx.db.insert("off_movements", {
          productId: item.itemId,
          productName: item.productName,
          type: "sale",
          quantity: item.quantity,
          previousStock: product.totalStock,
          newStock: newTotal,
          reason: `Sale - ${billNumber}`,
          sizeDetails: { size: item.size },
          billNumber,
          createdAt: nowIso(),
          createdBy: args.createdBy,
        });
      }
    }

    const billId = await ctx.db.insert("off_bills", {
      billNumber,
      items: args.items,
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      subtotal: args.subtotal,
      discount: args.discount,
      tax: args.tax,
      total: args.total,
      paymentMethod: args.paymentMethod,
      createdAt: nowIso(),
      createdBy: args.createdBy,
    });

    return { success: true, billId, billNumber };
  },
});

export const getBills = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 100 }) => {
    return await ctx.db.query("off_bills").order("desc").take(limit);
  },
});

export const getTodaySales = query({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];
    const bills = await ctx.db.query("off_bills").order("desc").collect();
    const todayBills = bills.filter(b => b.createdAt.startsWith(today));

    let total = 0, cash = 0, card = 0, upi = 0;
    todayBills.forEach(b => {
      total += b.total;
      if (b.paymentMethod === "cash") cash += b.total;
      else if (b.paymentMethod === "card") card += b.total;
      else if (b.paymentMethod === "upi") upi += b.total;
    });

    return { total, cash, card, upi, count: todayBills.length };
  },
});
