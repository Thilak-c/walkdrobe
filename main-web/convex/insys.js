import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const nowIso = () => new Date().toISOString();

// ============ RETURNS & EXCHANGES ============

export const createReturn = mutation({
  args: {
    originalBillNumber: v.string(),
    type: v.string(),
    items: v.array(v.object({
      productId: v.string(),
      productName: v.string(),
      productImage: v.optional(v.string()),
      itemId: v.string(),
      size: v.optional(v.string()),
      price: v.float64(),
      quantity: v.number(),
    })),
    exchangeItems: v.optional(v.array(v.object({
      productId: v.string(),
      productName: v.string(),
      productImage: v.optional(v.string()),
      itemId: v.string(),
      size: v.optional(v.string()),
      price: v.float64(),
      quantity: v.number(),
    }))),
    customerName: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    reason: v.string(),
    refundAmount: v.float64(),
    additionalPayment: v.optional(v.float64()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const date = new Date();
    const returnNumber = `RET${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}${String(date.getSeconds()).padStart(2, "0")}`;
    
    const returnId = await ctx.db.insert("returns", {
      returnNumber,
      originalBillNumber: args.originalBillNumber,
      type: args.type,
      items: args.items,
      exchangeItems: args.exchangeItems,
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      reason: args.reason,
      refundAmount: args.refundAmount,
      additionalPayment: args.additionalPayment,
      status: "completed",
      createdAt: nowIso(),
      processedAt: nowIso(),
      createdBy: args.createdBy,
      processedBy: args.createdBy,
    });

    // Restore stock for returned items
    for (const item of args.items) {
      const product = await ctx.db.query("products").filter(q => q.eq(q.field("itemId"), item.itemId)).first();
      if (product) {
        const sizeStock = product.sizeStock || {};
        if (item.size) {
          sizeStock[item.size] = (sizeStock[item.size] || 0) + item.quantity;
        }
        const newTotal = Object.values(sizeStock).reduce((sum, qty) => sum + (qty || 0), 0);
        await ctx.db.patch(product._id, {
          sizeStock,
          currentStock: newTotal,
          totalAvailable: newTotal,
          inStock: newTotal > 0,
          updatedAt: nowIso(),
        });
        
        await ctx.db.insert("inventoryMovements", {
          productId: item.itemId,
          productName: item.productName,
          productImage: item.productImage,
          type: "return",
          quantity: item.quantity,
          previousStock: newTotal - item.quantity,
          newStock: newTotal,
          reason: `Return - ${returnNumber}`,
          sizeDetails: item.size ? { size: item.size } : undefined,
          createdAt: nowIso(),
          createdBy: args.createdBy,
        });
      }
    }

    // Deduct stock for exchange items
    if (args.exchangeItems) {
      for (const item of args.exchangeItems) {
        const product = await ctx.db.query("products").filter(q => q.eq(q.field("itemId"), item.itemId)).first();
        if (product) {
          const sizeStock = product.sizeStock || {};
          if (item.size) {
            sizeStock[item.size] = Math.max(0, (sizeStock[item.size] || 0) - item.quantity);
          }
          const newTotal = Object.values(sizeStock).reduce((sum, qty) => sum + (qty || 0), 0);
          await ctx.db.patch(product._id, {
            sizeStock,
            currentStock: newTotal,
            totalAvailable: newTotal,
            inStock: newTotal > 0,
            updatedAt: nowIso(),
          });
        }
      }
    }

    return { success: true, returnId, returnNumber };
  },
});

export const getReturns = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 100 }) => {
    return await ctx.db.query("returns").order("desc").take(limit);
  },
});


// ============ CUSTOMERS ============

export const upsertCustomer = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    purchaseAmount: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("customers").withIndex("by_phone", q => q.eq("phone", args.phone)).first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        email: args.email || existing.email,
        address: args.address || existing.address,
        totalPurchases: existing.totalPurchases + 1,
        totalSpent: existing.totalSpent + (args.purchaseAmount || 0),
        lastVisit: nowIso(),
        updatedAt: nowIso(),
      });
      return { customerId: existing._id, isNew: false };
    }
    
    const customerId = await ctx.db.insert("customers", {
      name: args.name,
      phone: args.phone,
      email: args.email,
      address: args.address,
      totalPurchases: 1,
      totalSpent: args.purchaseAmount || 0,
      lastVisit: nowIso(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    return { customerId, isNew: true };
  },
});

export const getCustomers = query({
  args: { searchQuery: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, { searchQuery, limit = 100 }) => {
    let customers = await ctx.db.query("customers").order("desc").take(limit);
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      customers = customers.filter(c => 
        c.name?.toLowerCase().includes(search) || c.phone?.includes(search)
      );
    }
    return customers;
  },
});

export const getCustomerByPhone = query({
  args: { phone: v.string() },
  handler: async (ctx, { phone }) => {
    return await ctx.db.query("customers").withIndex("by_phone", q => q.eq("phone", phone)).first();
  },
});


// ============ SUPPLIERS ============

export const createSupplier = mutation({
  args: {
    name: v.string(),
    contactPerson: v.optional(v.string()),
    phone: v.string(),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    gstNumber: v.optional(v.string()),
    paymentTerms: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("suppliers", {
      ...args,
      isActive: true,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
  },
});

export const updateSupplier = mutation({
  args: {
    supplierId: v.id("suppliers"),
    updates: v.object({
      name: v.optional(v.string()),
      contactPerson: v.optional(v.string()),
      phone: v.optional(v.string()),
      email: v.optional(v.string()),
      address: v.optional(v.string()),
      gstNumber: v.optional(v.string()),
      paymentTerms: v.optional(v.string()),
      notes: v.optional(v.string()),
      isActive: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, { supplierId, updates }) => {
    await ctx.db.patch(supplierId, { ...updates, updatedAt: nowIso() });
    return { success: true };
  },
});

export const getSuppliers = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, { activeOnly = false }) => {
    let suppliers = await ctx.db.query("suppliers").order("desc").collect();
    if (activeOnly) suppliers = suppliers.filter(s => s.isActive);
    return suppliers;
  },
});

export const deleteSupplier = mutation({
  args: { supplierId: v.id("suppliers") },
  handler: async (ctx, { supplierId }) => {
    await ctx.db.patch(supplierId, { isActive: false, updatedAt: nowIso() });
    return { success: true };
  },
});


// ============ PURCHASE ORDERS ============

export const createPurchaseOrder = mutation({
  args: {
    supplierId: v.id("suppliers"),
    supplierName: v.string(),
    items: v.array(v.object({
      productId: v.optional(v.string()),
      productName: v.string(),
      itemId: v.optional(v.string()),
      size: v.optional(v.string()),
      quantity: v.number(),
      unitCost: v.float64(),
      totalCost: v.float64(),
    })),
    subtotal: v.float64(),
    tax: v.optional(v.float64()),
    shipping: v.optional(v.float64()),
    total: v.float64(),
    expectedDelivery: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const date = new Date();
    const poNumber = `PO${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`;
    
    return await ctx.db.insert("purchaseOrders", {
      poNumber,
      ...args,
      status: "draft",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
  },
});

export const updatePurchaseOrderStatus = mutation({
  args: {
    poId: v.id("purchaseOrders"),
    status: v.string(),
  },
  handler: async (ctx, { poId, status }) => {
    const updates = { status, updatedAt: nowIso() };
    if (status === "received") updates.receivedAt = nowIso();
    await ctx.db.patch(poId, updates);
    return { success: true };
  },
});

export const receivePurchaseOrder = mutation({
  args: { poId: v.id("purchaseOrders"), receivedBy: v.string() },
  handler: async (ctx, { poId, receivedBy }) => {
    const po = await ctx.db.get(poId);
    if (!po) throw new Error("PO not found");
    
    // Add stock for each item
    for (const item of po.items) {
      if (item.itemId) {
        const product = await ctx.db.query("products").filter(q => q.eq(q.field("itemId"), item.itemId)).first();
        if (product) {
          const sizeStock = product.sizeStock || {};
          if (item.size) {
            sizeStock[item.size] = (sizeStock[item.size] || 0) + item.quantity;
          }
          const newTotal = Object.values(sizeStock).reduce((sum, qty) => sum + (qty || 0), 0);
          const oldTotal = product.currentStock || 0;
          
          await ctx.db.patch(product._id, {
            sizeStock,
            currentStock: newTotal,
            totalAvailable: newTotal,
            inStock: newTotal > 0,
            updatedAt: nowIso(),
          });
          
          await ctx.db.insert("inventoryMovements", {
            productId: item.itemId,
            productName: item.productName,
            type: "stock_in",
            quantity: item.quantity,
            previousStock: oldTotal,
            newStock: newTotal,
            reason: `PO Received - ${po.poNumber}`,
            sizeDetails: item.size ? { size: item.size } : undefined,
            createdAt: nowIso(),
            createdBy: receivedBy,
          });
        }
      }
    }
    
    await ctx.db.patch(poId, { status: "received", receivedAt: nowIso(), updatedAt: nowIso() });
    return { success: true };
  },
});

export const getPurchaseOrders = query({
  args: { status: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, { status, limit = 100 }) => {
    let pos = await ctx.db.query("purchaseOrders").order("desc").take(limit);
    if (status) pos = pos.filter(p => p.status === status);
    return pos;
  },
});


// ============ EXPENSES ============

export const createExpense = mutation({
  args: {
    category: v.string(),
    description: v.string(),
    amount: v.float64(),
    paymentMethod: v.string(),
    vendor: v.optional(v.string()),
    receiptUrl: v.optional(v.string()),
    date: v.string(),
    isRecurring: v.boolean(),
    recurringFrequency: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("expenses", { ...args, createdAt: nowIso() });
  },
});

export const getExpenses = query({
  args: { 
    startDate: v.optional(v.string()), 
    endDate: v.optional(v.string()),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { startDate, endDate, category, limit = 100 }) => {
    let expenses = await ctx.db.query("expenses").order("desc").take(limit);
    if (startDate) expenses = expenses.filter(e => e.date >= startDate);
    if (endDate) expenses = expenses.filter(e => e.date <= endDate);
    if (category) expenses = expenses.filter(e => e.category === category);
    return expenses;
  },
});

export const deleteExpense = mutation({
  args: { expenseId: v.id("expenses") },
  handler: async (ctx, { expenseId }) => {
    await ctx.db.delete(expenseId);
    return { success: true };
  },
});

export const getExpenseStats = query({
  args: { startDate: v.optional(v.string()), endDate: v.optional(v.string()) },
  handler: async (ctx, { startDate, endDate }) => {
    let expenses = await ctx.db.query("expenses").collect();
    if (startDate) expenses = expenses.filter(e => e.date >= startDate);
    if (endDate) expenses = expenses.filter(e => e.date <= endDate);
    
    const byCategory = {};
    let total = 0;
    expenses.forEach(e => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
      total += e.amount;
    });
    
    return { total, byCategory, count: expenses.length };
  },
});


// ============ DAILY REPORTS ============

export const generateDailyReport = mutation({
  args: { date: v.string(), openingCash: v.optional(v.float64()), closingCash: v.optional(v.float64()), notes: v.optional(v.string()), closedBy: v.string() },
  handler: async (ctx, { date, openingCash, closingCash, notes, closedBy }) => {
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;
    
    // Get bills for the day
    const bills = await ctx.db.query("bills").collect();
    const dayBills = bills.filter(b => b.createdAt >= startOfDay && b.createdAt <= endOfDay);
    
    let totalSales = 0, cashSales = 0, cardSales = 0, upiSales = 0;
    const productSales = {};
    
    dayBills.forEach(bill => {
      totalSales += bill.total;
      if (bill.paymentMethod === "cash") cashSales += bill.total;
      else if (bill.paymentMethod === "card") cardSales += bill.total;
      else if (bill.paymentMethod === "upi") upiSales += bill.total;
      
      bill.items?.forEach(item => {
        const key = item.itemId;
        if (!productSales[key]) {
          productSales[key] = { productId: item.itemId, productName: item.productName, quantity: 0, revenue: 0 };
        }
        productSales[key].quantity += item.quantity;
        productSales[key].revenue += item.price * item.quantity;
      });
    });
    
    // Get returns for the day
    const returns = await ctx.db.query("returns").collect();
    const dayReturns = returns.filter(r => r.createdAt >= startOfDay && r.createdAt <= endOfDay);
    const totalReturns = dayReturns.reduce((sum, r) => sum + r.refundAmount, 0);
    
    // Get expenses for the day
    const expenses = await ctx.db.query("expenses").collect();
    const dayExpenses = expenses.filter(e => e.date === date);
    const totalExpenses = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    const topSellingProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    const netRevenue = totalSales - totalReturns - totalExpenses;
    const cashDifference = closingCash !== undefined && openingCash !== undefined ? closingCash - openingCash - cashSales + totalReturns : undefined;
    
    // Check if report exists
    const existing = await ctx.db.query("dailyReports").withIndex("by_date", q => q.eq("date", date)).first();
    
    const reportData = {
      date,
      totalSales,
      totalTransactions: dayBills.length,
      cashSales,
      cardSales,
      upiSales,
      totalReturns,
      returnCount: dayReturns.length,
      totalExpenses,
      netRevenue,
      topSellingProducts,
      openingCash,
      closingCash,
      cashDifference,
      notes,
      closedBy,
      closedAt: nowIso(),
      createdAt: nowIso(),
    };
    
    if (existing) {
      await ctx.db.patch(existing._id, reportData);
      return { reportId: existing._id, isNew: false };
    }
    
    const reportId = await ctx.db.insert("dailyReports", reportData);
    return { reportId, isNew: true };
  },
});

export const getDailyReport = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    return await ctx.db.query("dailyReports").withIndex("by_date", q => q.eq("date", date)).first();
  },
});

export const getDailyReports = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 30 }) => {
    return await ctx.db.query("dailyReports").order("desc").take(limit);
  },
});


// ============ PROFIT/LOSS ANALYTICS ============

export const getProfitAnalytics = query({
  args: { startDate: v.optional(v.string()), endDate: v.optional(v.string()) },
  handler: async (ctx, { startDate, endDate }) => {
    const bills = await ctx.db.query("bills").collect();
    const products = await ctx.db.query("products").filter(q => q.neq(q.field("isDeleted"), true)).collect();
    const expenses = await ctx.db.query("expenses").collect();
    const returns = await ctx.db.query("returns").collect();
    
    // Create product cost map
    const productCostMap = {};
    products.forEach(p => { productCostMap[p.itemId] = p.costPrice || 0; });
    
    // Filter by date
    let filteredBills = bills;
    let filteredExpenses = expenses;
    let filteredReturns = returns;
    
    if (startDate) {
      filteredBills = filteredBills.filter(b => b.createdAt >= startDate);
      filteredExpenses = filteredExpenses.filter(e => e.date >= startDate);
      filteredReturns = filteredReturns.filter(r => r.createdAt >= startDate);
    }
    if (endDate) {
      filteredBills = filteredBills.filter(b => b.createdAt <= endDate);
      filteredExpenses = filteredExpenses.filter(e => e.date <= endDate);
      filteredReturns = filteredReturns.filter(r => r.createdAt <= endDate);
    }
    
    let totalRevenue = 0, totalCost = 0, totalExpenses = 0, totalRefunds = 0;
    
    filteredBills.forEach(bill => {
      totalRevenue += bill.total;
      bill.items?.forEach(item => {
        totalCost += (productCostMap[item.itemId] || 0) * item.quantity;
      });
    });
    
    filteredExpenses.forEach(e => { totalExpenses += e.amount; });
    filteredReturns.forEach(r => { totalRefunds += r.refundAmount; });
    
    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit - totalExpenses - totalRefunds;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    return {
      totalRevenue,
      totalCost,
      grossProfit,
      totalExpenses,
      totalRefunds,
      netProfit,
      profitMargin: profitMargin.toFixed(2),
      transactionCount: filteredBills.length,
    };
  },
});

// ============ PRODUCT EDIT/DELETE ============

export const updateProduct = mutation({
  args: {
    productId: v.id("products"),
    updates: v.object({
      name: v.optional(v.string()),
      category: v.optional(v.string()),
      price: v.optional(v.float64()),
      costPrice: v.optional(v.float64()),
      description: v.optional(v.string()),
      mainImage: v.optional(v.string()),
      color: v.optional(v.string()),
      availableSizes: v.optional(v.array(v.string())),
      sizeStock: v.optional(v.any()),
      isHidden: v.optional(v.boolean()),
    }),
    updatedBy: v.string(),
  },
  handler: async (ctx, { productId, updates, updatedBy }) => {
    const product = await ctx.db.get(productId);
    if (!product) throw new Error("Product not found");
    
    // Recalculate total stock if sizeStock is updated
    if (updates.sizeStock) {
      updates.currentStock = Object.values(updates.sizeStock).reduce((sum, qty) => sum + (qty || 0), 0);
      updates.totalAvailable = updates.currentStock;
      updates.inStock = updates.currentStock > 0;
    }
    
    await ctx.db.patch(productId, { ...updates, updatedAt: nowIso(), updatedBy });
    return { success: true };
  },
});

export const deleteProduct = mutation({
  args: { productId: v.id("products"), deletedBy: v.string() },
  handler: async (ctx, { productId, deletedBy }) => {
    await ctx.db.patch(productId, { isDeleted: true, deletedAt: nowIso(), deletedBy });
    return { success: true };
  },
});


// ============ BULK OPERATIONS ============

export const bulkAddStock = mutation({
  args: {
    items: v.array(v.object({
      productId: v.id("products"),
      sizeStock: v.any(),
    })),
    reason: v.string(),
    updatedBy: v.string(),
  },
  handler: async (ctx, { items, reason, updatedBy }) => {
    const results = [];
    for (const item of items) {
      try {
        const product = await ctx.db.get(item.productId);
        if (!product) { results.push({ productId: item.productId, success: false, error: "Not found" }); continue; }
        
        const oldSizeStock = product.sizeStock || {};
        const newSizeStock = { ...oldSizeStock };
        
        Object.entries(item.sizeStock).forEach(([size, qty]) => {
          newSizeStock[size] = (newSizeStock[size] || 0) + qty;
        });
        
        const newTotal = Object.values(newSizeStock).reduce((sum, qty) => sum + (qty || 0), 0);
        const oldTotal = product.currentStock || 0;
        
        await ctx.db.patch(item.productId, {
          sizeStock: newSizeStock,
          currentStock: newTotal,
          totalAvailable: newTotal,
          inStock: newTotal > 0,
          updatedAt: nowIso(),
        });
        
        await ctx.db.insert("inventoryMovements", {
          productId: product.itemId,
          productName: product.name,
          type: "stock_in",
          quantity: newTotal - oldTotal,
          previousStock: oldTotal,
          newStock: newTotal,
          reason,
          createdAt: nowIso(),
          createdBy: updatedBy,
        });
        
        results.push({ productId: item.productId, success: true });
      } catch (error) {
        results.push({ productId: item.productId, success: false, error: error.message });
      }
    }
    return results;
  },
});

// ============ LIVE SALES DATA ============

export const getTodaySales = query({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];
    const startOfDay = `${today}T00:00:00`;
    
    const bills = await ctx.db.query("bills").collect();
    const todayBills = bills.filter(b => b.createdAt >= startOfDay);
    
    let total = 0, cash = 0, card = 0, upi = 0;
    todayBills.forEach(b => {
      total += b.total;
      if (b.paymentMethod === "cash") cash += b.total;
      else if (b.paymentMethod === "card") card += b.total;
      else if (b.paymentMethod === "upi") upi += b.total;
    });
    
    return { total, cash, card, upi, transactions: todayBills.length, bills: todayBills };
  },
});

// ============ CUSTOMER PURCHASE HISTORY ============

export const getCustomerPurchaseHistory = query({
  args: { phone: v.string() },
  handler: async (ctx, { phone }) => {
    const bills = await ctx.db.query("bills").collect();
    return bills.filter(b => b.customerPhone === phone).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
});

// ============ BACKUP/EXPORT ============

export const getFullBackup = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").filter(q => q.neq(q.field("isDeleted"), true)).collect();
    const bills = await ctx.db.query("bills").collect();
    const customers = await ctx.db.query("customers").collect();
    const suppliers = await ctx.db.query("suppliers").collect();
    const purchaseOrders = await ctx.db.query("purchaseOrders").collect();
    const expenses = await ctx.db.query("expenses").collect();
    const returns = await ctx.db.query("returns").collect();
    const movements = await ctx.db.query("inventoryMovements").collect();
    
    return {
      exportedAt: nowIso(),
      products,
      bills,
      customers,
      suppliers,
      purchaseOrders,
      expenses,
      returns,
      movements,
    };
  },
});


// ============ WEBSITE INVENTORY ============

export const updateWebsiteStock = mutation({
  args: {
    productId: v.id("products"),
    websiteSizeStock: v.any(),
    updatedBy: v.string(),
  },
  handler: async (ctx, { productId, websiteSizeStock, updatedBy }) => {
    const product = await ctx.db.get(productId);
    if (!product) throw new Error("Product not found");

    const totalStock = Object.values(websiteSizeStock).reduce((sum, qty) => sum + (qty || 0), 0);
    const oldStock = product.websiteStock || 0;

    await ctx.db.patch(productId, {
      websiteSizeStock,
      websiteStock: totalStock,
      websiteInStock: totalStock > 0,
      updatedAt: nowIso(),
      updatedBy,
    });

    // Log movement
    await ctx.db.insert("inventoryMovements", {
      productId: product.itemId,
      productName: product.name,
      productImage: product.mainImage,
      type: "size_update",
      quantity: totalStock - oldStock,
      previousStock: oldStock,
      newStock: totalStock,
      reason: "Website stock update",
      sizeDetails: websiteSizeStock,
      createdAt: nowIso(),
      createdBy: updatedBy,
    });

    return { success: true, totalStock };
  },
});

export const getWebsiteInventory = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    // Filter for products with website stock
    return products
      .filter(p => p.websiteStock > 0 || p.websiteInStock || Object.keys(p.websiteSizeStock || {}).length > 0)
      .map(p => ({
        _id: p._id,
        itemId: p.itemId,
        name: p.name,
        category: p.category,
        price: p.price,
        costPrice: p.costPrice,
        mainImage: p.mainImage,
        websiteStock: p.websiteStock || 0,
        websiteInStock: p.websiteInStock || false,
        websiteSizeStock: p.websiteSizeStock || {},
        availableSizes: p.availableSizes || [],
        updatedAt: p.updatedAt,
      }));
  },
});

export const getWebsiteStats = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    const websiteProducts = products.filter(p => 
      p.websiteStock > 0 || p.websiteInStock || Object.keys(p.websiteSizeStock || {}).length > 0
    );

    const stats = {
      totalProducts: websiteProducts.length,
      totalStock: 0,
      inStock: 0,
      lowStock: 0,
      outOfStock: 0,
      totalValue: 0,
      categoryBreakdown: {},
    };

    websiteProducts.forEach(p => {
      const stock = p.websiteStock || 0;
      stats.totalStock += stock;
      stats.totalValue += stock * (p.price || 0);

      if (stock === 0) {
        stats.outOfStock++;
      } else if (stock <= 10) {
        stats.lowStock++;
      } else {
        stats.inStock++;
      }

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

export const getWebsiteLowStock = query({
  args: { threshold: v.optional(v.number()) },
  handler: async (ctx, { threshold = 10 }) => {
    const products = await ctx.db
      .query("products")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    return products
      .filter(p => {
        const stock = p.websiteStock || 0;
        return (p.websiteInStock || Object.keys(p.websiteSizeStock || {}).length > 0) && stock <= threshold;
      })
      .map(p => ({
        _id: p._id,
        itemId: p.itemId,
        name: p.name,
        category: p.category,
        websiteStock: p.websiteStock || 0,
        websiteSizeStock: p.websiteSizeStock || {},
        price: p.price,
        mainImage: p.mainImage,
      }))
      .sort((a, b) => a.websiteStock - b.websiteStock);
  },
});


// ============ ADD WEBSITE PRODUCT ============

export const addWebsiteProduct = mutation({
  args: {
    itemId: v.string(),
    name: v.string(),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.float64(),
    costPrice: v.optional(v.float64()),
    mainImage: v.string(),
    otherImages: v.optional(v.array(v.string())),
    availableSizes: v.array(v.string()),
    websiteSizeStock: v.any(),
    websiteStock: v.number(),
    color: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if product with same itemId exists
    const existing = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("itemId"), args.itemId))
      .first();
    
    if (existing) {
      throw new Error("Product with this SKU already exists");
    }

    const productId = await ctx.db.insert("products", {
      itemId: args.itemId,
      name: args.name,
      category: args.category || "",
      description: args.description || "",
      price: args.price,
      costPrice: args.costPrice || 0,
      mainImage: args.mainImage,
      otherImages: args.otherImages || [],
      availableSizes: args.availableSizes,
      color: args.color || "",
      secondaryColor: args.secondaryColor || "",
      // Website stock
      websiteSizeStock: args.websiteSizeStock,
      websiteStock: args.websiteStock,
      websiteInStock: args.websiteStock > 0,
      // Offline stock (empty for website-only products)
      sizeStock: {},
      currentStock: 0,
      totalAvailable: 0,
      inStock: false,
      // Defaults
      buys: 0,
      inCart: 0,
      isHidden: false,
      isDeleted: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });

    return { success: true, productId };
  },
});
