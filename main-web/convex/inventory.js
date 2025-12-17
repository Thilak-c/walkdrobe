import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const nowIso = () => new Date().toISOString();

// ============ INVENTORY QUERIES ============

// Get all inventory with product details
export const getAllInventory = query({
  args: {
    searchQuery: v.optional(v.string()),
    stockFilter: v.optional(v.string()), // 'all', 'in_stock', 'low_stock', 'out_of_stock'
    category: v.optional(v.string()),
    sortBy: v.optional(v.string()),
    sortOrder: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let products = await ctx.db
      .query("products")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    // Apply search filter
    if (args.searchQuery) {
      const search = args.searchQuery.toLowerCase();
      products = products.filter(p => 
        p.name?.toLowerCase().includes(search) ||
        p.itemId?.toLowerCase().includes(search) ||
        p.category?.toLowerCase().includes(search)
      );
    }

    // Apply category filter
    if (args.category && args.category !== 'all') {
      products = products.filter(p => p.category === args.category);
    }

    // Apply stock filter
    if (args.stockFilter && args.stockFilter !== 'all') {
      products = products.filter(p => {
        const stock = p.currentStock ?? p.totalAvailable ?? 0;
        switch (args.stockFilter) {
          case 'in_stock': return stock > 10;
          case 'low_stock': return stock > 0 && stock <= 10;
          case 'out_of_stock': return stock === 0 || p.inStock === false;
          default: return true;
        }
      });
    }

    // Sort
    const sortBy = args.sortBy || 'name';
    const sortOrder = args.sortOrder || 'asc';
    products.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'stock':
          aVal = a.currentStock ?? a.totalAvailable ?? 0;
          bVal = b.currentStock ?? b.totalAvailable ?? 0;
          break;
        case 'price':
          aVal = a.price ?? 0;
          bVal = b.price ?? 0;
          break;
        case 'name':
        default:
          aVal = a.name?.toLowerCase() ?? '';
          bVal = b.name?.toLowerCase() ?? '';
      }
      if (sortOrder === 'desc') return bVal > aVal ? 1 : -1;
      return aVal > bVal ? 1 : -1;
    });

    return products.map(p => ({
      _id: p._id,
      itemId: p.itemId,
      name: p.name,
      category: p.category,
      price: p.price,
      costPrice: p.costPrice,
      mainImage: p.mainImage,
      // Offline store stock
      currentStock: p.currentStock ?? p.totalAvailable ?? 0,
      inStock: p.inStock ?? true,
      availableSizes: p.availableSizes || [],
      sizeStock: p.sizeStock || {},
      // Website store stock
      websiteStock: p.websiteStock ?? 0,
      websiteInStock: p.websiteInStock ?? false,
      websiteSizeStock: p.websiteSizeStock || {},
      updatedAt: p.updatedAt,
    }));
  },
});

// Get inventory summary stats
export const getInventoryStats = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    const stats = {
      totalProducts: products.length,
      totalStock: 0,
      inStock: 0,
      lowStock: 0,
      outOfStock: 0,
      totalValue: 0,
      categoryBreakdown: {},
    };

    products.forEach(p => {
      const stock = p.currentStock ?? p.totalAvailable ?? 0;
      stats.totalStock += stock;
      stats.totalValue += stock * (p.price || 0);

      if (stock === 0 || p.inStock === false) {
        stats.outOfStock++;
      } else if (stock <= 10) {
        stats.lowStock++;
      } else {
        stats.inStock++;
      }

      // Category breakdown
      const cat = p.category || 'Uncategorized';
      if (!stats.categoryBreakdown[cat]) {
        stats.categoryBreakdown[cat] = { count: 0, stock: 0, value: 0 };
      }
      stats.categoryBreakdown[cat].count++;
      stats.categoryBreakdown[cat].stock += stock;
      stats.categoryBreakdown[cat].value += stock * (p.price || 0);
    });

    return stats;
  },
});

// Get low stock alerts
export const getLowStockAlerts = query({
  args: { threshold: v.optional(v.number()) },
  handler: async (ctx, { threshold = 10 }) => {
    const products = await ctx.db
      .query("products")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    return products
      .filter(p => {
        const stock = p.currentStock ?? p.totalAvailable ?? 0;
        return stock <= threshold;
      })
      .map(p => ({
        _id: p._id,
        itemId: p.itemId,
        name: p.name,
        category: p.category,
        currentStock: p.currentStock ?? p.totalAvailable ?? 0,
        price: p.price,
        mainImage: p.mainImage,
      }))
      .sort((a, b) => a.currentStock - b.currentStock);
  },
});

// Get inventory history/movements
export const getInventoryMovements = query({
  args: {
    productId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { productId, limit = 50 }) => {
    let query = ctx.db.query("inventoryMovements");
    
    if (productId) {
      query = query.filter((q) => q.eq(q.field("productId"), productId));
    }
    
    const movements = await query.order("desc").take(limit);
    return movements;
  },
});

// ============ INVENTORY MUTATIONS ============

// Update stock for a single product
export const updateStock = mutation({
  args: {
    productId: v.id("products"),
    newStock: v.number(),
    reason: v.optional(v.string()),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, { productId, newStock, reason, updatedBy }) => {
    const product = await ctx.db.get(productId);
    if (!product) throw new Error("Product not found");

    const oldStock = product.currentStock ?? product.totalAvailable ?? 0;
    const change = newStock - oldStock;

    // Update product
    await ctx.db.patch(productId, {
      currentStock: newStock,
      totalAvailable: newStock,
      inStock: newStock > 0,
      updatedAt: nowIso(),
      updatedBy: updatedBy || "admin",
    });

    // Log movement
    await ctx.db.insert("inventoryMovements", {
      productId: product.itemId,
      productName: product.name,
      productImage: product.mainImage || null,
      type: change > 0 ? "stock_in" : "stock_out",
      quantity: Math.abs(change),
      previousStock: oldStock,
      newStock: newStock,
      reason: reason || "Manual adjustment",
      createdAt: nowIso(),
      createdBy: updatedBy || "admin",
    });

    return { success: true, oldStock, newStock, change };
  },
});

// Update size-specific stock
export const updateSizeStock = mutation({
  args: {
    productId: v.id("products"),
    sizeStock: v.any(),
    availableSizes: v.optional(v.array(v.string())),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, { productId, sizeStock, availableSizes, updatedBy }) => {
    const product = await ctx.db.get(productId);
    if (!product) throw new Error("Product not found");

    // Calculate total stock from sizes
    const totalStock = Object.values(sizeStock).reduce((sum, qty) => sum + (qty || 0), 0);
    // Use provided availableSizes or derive from sizeStock
    const sizes = availableSizes || Object.keys(sizeStock);

    await ctx.db.patch(productId, {
      sizeStock,
      availableSizes: sizes,
      currentStock: totalStock,
      totalAvailable: totalStock,
      inStock: totalStock > 0,
      updatedAt: nowIso(),
      updatedBy: updatedBy || "admin",
    });

    // Log movement
    await ctx.db.insert("inventoryMovements", {
      productId: product.itemId,
      productName: product.name,
      productImage: product.mainImage || null,
      type: "size_update",
      quantity: totalStock,
      previousStock: product.currentStock ?? 0,
      newStock: totalStock,
      reason: "Size stock update",
      sizeDetails: sizeStock,
      createdAt: nowIso(),
      createdBy: updatedBy || "admin",
    });

    return { success: true, totalStock, availableSizes: sizes };
  },
});

// Bulk stock update
export const bulkUpdateStock = mutation({
  args: {
    updates: v.array(v.object({
      productId: v.id("products"),
      newStock: v.number(),
    })),
    reason: v.optional(v.string()),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, { updates, reason, updatedBy }) => {
    const results = [];

    for (const update of updates) {
      try {
        const product = await ctx.db.get(update.productId);
        if (!product) {
          results.push({ productId: update.productId, success: false, error: "Not found" });
          continue;
        }

        const oldStock = product.currentStock ?? 0;
        
        await ctx.db.patch(update.productId, {
          currentStock: update.newStock,
          totalAvailable: update.newStock,
          inStock: update.newStock > 0,
          updatedAt: nowIso(),
          updatedBy: updatedBy || "admin",
        });

        await ctx.db.insert("inventoryMovements", {
          productId: product.itemId,
          productName: product.name,
          type: update.newStock > oldStock ? "stock_in" : "stock_out",
          quantity: Math.abs(update.newStock - oldStock),
          previousStock: oldStock,
          newStock: update.newStock,
          reason: reason || "Bulk update",
          createdAt: nowIso(),
          createdBy: updatedBy || "admin",
        });

        results.push({ productId: update.productId, success: true });
      } catch (error) {
        results.push({ productId: update.productId, success: false, error: error.message });
      }
    }

    return results;
  },
});

// Add stock (restock)
export const addStock = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
    reason: v.optional(v.string()),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, { productId, quantity, reason, updatedBy }) => {
    const product = await ctx.db.get(productId);
    if (!product) throw new Error("Product not found");

    const oldStock = product.currentStock ?? product.totalAvailable ?? 0;
    const newStock = oldStock + quantity;

    await ctx.db.patch(productId, {
      currentStock: newStock,
      totalAvailable: newStock,
      inStock: true,
      updatedAt: nowIso(),
      updatedBy: updatedBy || "admin",
    });

    await ctx.db.insert("inventoryMovements", {
      productId: product.itemId,
      productName: product.name,
      productImage: product.mainImage || null,
      type: "stock_in",
      quantity,
      previousStock: oldStock,
      newStock,
      reason: reason || "Restock",
      createdAt: nowIso(),
      createdBy: updatedBy || "admin",
    });

    return { success: true, oldStock, newStock };
  },
});

// Remove stock
export const removeStock = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
    reason: v.optional(v.string()),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, { productId, quantity, reason, updatedBy }) => {
    const product = await ctx.db.get(productId);
    if (!product) throw new Error("Product not found");

    const oldStock = product.currentStock ?? product.totalAvailable ?? 0;
    const newStock = Math.max(0, oldStock - quantity);

    await ctx.db.patch(productId, {
      currentStock: newStock,
      totalAvailable: newStock,
      inStock: newStock > 0,
      updatedAt: nowIso(),
      updatedBy: updatedBy || "admin",
    });

    await ctx.db.insert("inventoryMovements", {
      productId: product.itemId,
      productName: product.name,
      productImage: product.mainImage || null,
      type: "stock_out",
      quantity,
      previousStock: oldStock,
      newStock,
      reason: reason || "Stock removal",
      createdAt: nowIso(),
      createdBy: updatedBy || "admin",
    });

    return { success: true, oldStock, newStock };
  },
});

// Remove stock for a specific size
export const removeSizeStock = mutation({
  args: {
    productId: v.id("products"),
    size: v.string(),
    quantity: v.number(),
    reason: v.optional(v.string()),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, { productId, size, quantity, reason, updatedBy }) => {
    const product = await ctx.db.get(productId);
    if (!product) throw new Error("Product not found");

    const sizeStock = product.sizeStock || {};
    const oldSizeQty = sizeStock[size] ?? 0;
    const newSizeQty = Math.max(0, oldSizeQty - quantity);
    
    // Update size stock
    const newSizeStock = { ...sizeStock, [size]: newSizeQty };
    
    // Calculate new total stock
    const newTotalStock = Object.values(newSizeStock).reduce((sum, qty) => sum + (qty || 0), 0);
    const oldTotalStock = product.currentStock ?? product.totalAvailable ?? 0;

    await ctx.db.patch(productId, {
      sizeStock: newSizeStock,
      currentStock: newTotalStock,
      totalAvailable: newTotalStock,
      inStock: newTotalStock > 0,
      updatedAt: nowIso(),
      updatedBy: updatedBy || "admin",
    });

    // Log movement
    await ctx.db.insert("inventoryMovements", {
      productId: product.itemId,
      productName: product.name,
      productImage: product.mainImage || null,
      type: "stock_out",
      quantity,
      previousStock: oldTotalStock,
      newStock: newTotalStock,
      reason: reason || `Size ${size} stock removal`,
      sizeDetails: { size, oldQty: oldSizeQty, newQty: newSizeQty },
      createdAt: nowIso(),
      createdBy: updatedBy || "admin",
    });

    return { success: true, size, oldQty: oldSizeQty, newQty: newSizeQty };
  },
});

// ============ BILLING FUNCTIONS ============

// Create a new bill
export const createBill = mutation({
  args: {
    billNumber: v.string(),
    items: v.array(v.object({
      productId: v.string(),
      productName: v.string(),
      productImage: v.optional(v.string()),
      itemId: v.string(),
      size: v.optional(v.string()),
      price: v.float64(),
      quantity: v.number(),
    })),
    customerName: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    subtotal: v.float64(),
    discount: v.optional(v.number()),
    discountAmount: v.optional(v.float64()),
    tax: v.float64(),
    total: v.float64(),
    paymentMethod: v.optional(v.string()),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const billId = await ctx.db.insert("bills", {
      billNumber: args.billNumber,
      items: args.items,
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      subtotal: args.subtotal,
      discount: args.discount || 0,
      discountAmount: args.discountAmount || 0,
      tax: args.tax,
      total: args.total,
      paymentMethod: args.paymentMethod || "cash",
      createdAt: nowIso(),
      createdBy: args.createdBy || "billing",
    });

    return { success: true, billId };
  },
});

// Get billing history
export const getBillingHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 100 }) => {
    const bills = await ctx.db
      .query("bills")
      .order("desc")
      .take(limit);

    return bills;
  },
});

// Get bill by bill number
export const getBillByNumber = query({
  args: {
    billNumber: v.string(),
  },
  handler: async (ctx, { billNumber }) => {
    const bill = await ctx.db
      .query("bills")
      .withIndex("by_bill_number", (q) => q.eq("billNumber", billNumber))
      .first();

    return bill;
  },
});


// ============ TRASH FUNCTIONS ============

// Move product to trash (for offline store using products table)
export const moveToTrash = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    const product = await ctx.db.get(productId);
    if (!product) throw new Error("Product not found");

    // Save to offline trash
    await ctx.db.insert("off_trash", {
      originalId: productId,
      itemId: product.itemId,
      name: product.name,
      productData: product,
      deletedAt: nowIso(),
      deletedBy: "admin",
    });

    // Delete from products
    await ctx.db.delete(productId);

    return { success: true };
  },
});

// Restore product from trash (for offline store)
export const restoreFromTrash = mutation({
  args: { trashId: v.id("off_trash") },
  handler: async (ctx, { trashId }) => {
    const trashItem = await ctx.db.get(trashId);
    if (!trashItem) throw new Error("Trash item not found");

    // Check if itemId already exists
    const existing = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("itemId"), trashItem.itemId))
      .first();
    if (existing) throw new Error("Product with this SKU already exists");

    // Restore product
    const { _id, _creationTime, isDeleted, ...productData } = trashItem.productData;
    await ctx.db.insert("products", {
      ...productData,
      isDeleted: false,
      updatedAt: nowIso(),
    });

    // Remove from trash
    await ctx.db.delete(trashId);

    return { success: true };
  },
});

// Get all trash items (for offline store)
export const getTrash = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("off_trash").order("desc").collect();
  },
});

// Get dead stock (products with zero sales)
export const getDeadStock = query({
  args: {
    daysOld: v.optional(v.number()), // Optional: filter by products older than X days
  },
  handler: async (ctx, { daysOld = 30 }) => {
    const products = await ctx.db
      .query("products")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return products
      .filter(p => {
        // No sales (buys = 0 or undefined)
        const hasSales = (p.buys || 0) > 0;
        if (hasSales) return false;

        // Check if product is old enough
        if (p.createdAt) {
          const createdDate = new Date(p.createdAt);
          return createdDate < cutoffDate;
        }
        return true; // Include if no createdAt
      })
      .map(p => ({
        _id: p._id,
        itemId: p.itemId,
        name: p.name,
        category: p.category,
        price: p.price,
        costPrice: p.costPrice || 0,
        currentStock: p.currentStock || p.totalAvailable || 0,
        mainImage: p.mainImage,
        createdAt: p.createdAt,
        buys: p.buys || 0,
        stockValue: (p.costPrice || p.price || 0) * (p.currentStock || p.totalAvailable || 0),
      }))
      .sort((a, b) => b.stockValue - a.stockValue);
  },
});
