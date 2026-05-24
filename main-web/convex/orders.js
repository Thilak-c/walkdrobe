import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Helper function to get current timestamp
const nowIso = () => new Date().toISOString();

// Generate unique order number
const generateOrderNumber = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `ORD${timestamp}${random}`;
};

// Calculate estimated delivery date - now gets updated by Shiprocket integration
const calculateEstimatedDelivery = (orderDate = Date.now()) => {
  const deliveryDate = new Date(orderDate);
  
  // Add 3-5 business days as initial estimate (will be updated by Shiprocket)
  let daysAdded = 0;
  let businessDaysAdded = 0;
  
  while (businessDaysAdded < 3) {
    deliveryDate.setDate(deliveryDate.getDate() + 1);
    daysAdded++;
    
    // Skip weekends (Saturday = 6, Sunday = 0)
    const dayOfWeek = deliveryDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDaysAdded++;
    }
  }
  
  return deliveryDate.getTime();
};

// Create initial delivery tracking entry
const createInitialDeliveryTracking = (orderTimestamp) => {
  return [
    {
      status: "order_placed",
      message: "Order has been placed successfully",
      timestamp: orderTimestamp,
      updatedBy: "system",
    }
  ];
};

// Create a new order
export const createOrder = mutation({
  args: {
    userId: v.any(),
    
    items: v.array(v.object({
      productId: v.string(),
      name: v.string(),
      price: v.float64(),
      image: v.string(),
      quantity: v.float64(),
      size: v.string(),
    })),
    shippingDetails: v.object({
      fullName: v.string(),
      email: v.string(),
      phone: v.string(),
      flatNo: v.optional(v.string()),
      area: v.optional(v.string()),
      landmark: v.optional(v.string()),
      address: v.string(),
      city: v.string(),
      state: v.string(),
      pincode: v.string(),
      country: v.string(),
    }),
    paymentDetails: v.object({
      razorpayOrderId: v.optional(v.string()),
      razorpayPaymentId: v.optional(v.string()),
      amount: v.float64(),
      currency: v.string(),
      status: v.string(),
      paidAt: v.optional(v.number()),
      paidBy: v.optional(v.string()),
      paymentMethod: v.optional(v.string()),
      codCharge: v.optional(v.float64()),
      remainingCOD: v.optional(v.float64()),
    }),
    orderTotal: v.float64(),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const orderNumber = generateOrderNumber();
    const orderTimestamp = Date.now();
    
    try {
      // Calculate estimated delivery date
      const estimatedDelivery = calculateEstimatedDelivery(orderTimestamp);
      
      // Create initial delivery tracking
      const initialDeliveryDetails = createInitialDeliveryTracking(orderTimestamp);
      
      // Enhanced payment details
      const enhancedPaymentDetails = {
        ...args.paymentDetails,
        paidAt: args.paymentDetails.paidAt || orderTimestamp,
        paidBy: args.paymentDetails.paidBy || args.shippingDetails.fullName,
        paymentMethod: args.paymentDetails.paymentMethod || "razorpay",
      };
      
      // Create the order
      const orderId = await ctx.db.insert("orders", {
        userId: args.userId,
  
        orderNumber,
        items: args.items,
        shippingDetails: args.shippingDetails,
        paymentDetails: enhancedPaymentDetails,
        orderTotal: args.orderTotal,
        status: args.status || "confirmed",
        estimatedDeliveryDate: estimatedDelivery,
        deliveryDetails: initialDeliveryDetails,
        createdAt: orderTimestamp,
        updatedAt: orderTimestamp,
      });

      // Admin notification is now sent from the frontend checkout page
      // This avoids Convex action/mutation limitations

      // Update stock for each item
      for (const item of args.items) {
        try {
          // Get the product to update stock
          const product = await ctx.db
            .query("products")
            .filter(q => q.or(
              q.eq(q.field("itemId"), item.productId),
              q.eq(q.field("_id"), item.productId)
            ))
            .filter(q => q.neq(q.field("isDeleted"), true))
            .unique();

          if (product) {
            // Update size-specific stock
            const updatedSizeStock = { ...product.sizeStock };
            if (updatedSizeStock[item.size] !== undefined) {
              updatedSizeStock[item.size] = Math.max(0, updatedSizeStock[item.size] - item.quantity);
            }

            // Update total stock and buys count
            const newCurrentStock = Math.max(0, (product.currentStock || 0) - item.quantity);
            const newBuys = (product.buys || 0) + item.quantity;

            // Check if product is now out of stock
            const totalStock = Object.values(updatedSizeStock).reduce((sum, stock) => sum + (stock || 0), 0);
            const stillInStock = totalStock > 0 && newCurrentStock > 0;

            await ctx.db.patch(product._id, {
              sizeStock: updatedSizeStock,
              currentStock: newCurrentStock,
              buys: newBuys,
              inStock: stillInStock,
            });
          }
        } catch (error) {
          // Don't fail the order creation if stock update fails
        }
      }

      return {
        success: true,
        orderId,
        orderNumber,
        message: "Order created successfully",
      };
    } catch (error) {
      throw new Error(error);
    }
  },
});
// Get user's orders
// OPTIMIZED: Added limit
export const getUserOrders = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    return orders;
  },
});

// Get order by order number
export const getOrderByNumber = query({
  args: {
    orderNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_order_number", (q) => q.eq("orderNumber", args.orderNumber))
      .unique();

    return order;
  },
});

// Update order status
export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.string(),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get order details before updating
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    const updateData = {
      status: args.status,
      updatedAt: Date.now(),
    };
    
    // Add timestamp for specific status changes
    if (args.status === "shipped") {
      updateData.shippedAt = Date.now();
    } else if (args.status === "delivered") {
      updateData.deliveredAt = Date.now();
    }
    
    await ctx.db.patch(args.orderId, updateData);
    
    // Return order details for email notification
    return { 
      success: true, 
      message: "Order status updated",
      orderDetails: {
        orderNumber: order.orderNumber,
        customerEmail: order.shippingDetails.email,
        customerName: order.shippingDetails.fullName,
        status: args.status,
        items: order.items,
        orderTotal: order.orderTotal,
        shippingDetails: order.shippingDetails,
        paymentDetails: order.paymentDetails,
        deliveryDetails: order.deliveryDetails || [],
        createdAt: order.createdAt,
        estimatedDeliveryDate: order.estimatedDeliveryDate,
      }
    };
  },
});

// Add delivery tracking update
export const addDeliveryUpdate = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.string(),
    message: v.string(),
    location: v.optional(v.string()),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    const newDeliveryUpdate = {
      status: args.status,
      message: args.message,
      location: args.location,
      timestamp: Date.now(),
      updatedBy: args.updatedBy || "system",
    };

    const updatedDeliveryDetails = [
      ...(order.deliveryDetails || []),
      newDeliveryUpdate
    ];

    await ctx.db.patch(args.orderId, {
      deliveryDetails: updatedDeliveryDetails,
      status: args.status, // Update main order status as well
      updatedAt: Date.now(),
    });

    // Return order details for email notification
    return { 
      success: true, 
      message: "Delivery status updated",
      deliveryUpdate: newDeliveryUpdate,
      orderDetails: {
        orderNumber: order.orderNumber,
        customerEmail: order.shippingDetails.email,
        customerName: order.shippingDetails.fullName,
        status: args.status,
        items: order.items,
        orderTotal: order.orderTotal,
      }
    };
  },
});

// Update estimated delivery date
export const updateEstimatedDelivery = mutation({
  args: {
    orderId: v.id("orders"),
    estimatedDeliveryDate: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orderId, {
      estimatedDeliveryDate: args.estimatedDeliveryDate,
      updatedAt: Date.now(),
    });

    // Add delivery update if reason provided
    if (args.reason) {
      const order = await ctx.db.get(args.orderId);
      const deliveryUpdate = {
        status: "delivery_updated",
        message: `Delivery date updated: ${args.reason}`,
        timestamp: Date.now(),
        updatedBy: "system",
      };

      const updatedDeliveryDetails = [
        ...(order.deliveryDetails || []),
        deliveryUpdate
      ];

      await ctx.db.patch(args.orderId, {
        deliveryDetails: updatedDeliveryDetails,
      });
    }

    return { success: true, message: "Estimated delivery date updated" };
  },
});

// Get orders by status for admin
// OPTIMIZED: Added limit
export const getOrdersByStatus = query({
  args: {
    status: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .take(limit);

    return orders;
  },
});

// Get order by ID
export const getOrderById = query({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.orderId);
  },
});

// Get all orders for admin dashboard
export const getAllOrders = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .order("desc")
      .take(args.limit || 100);
    
    return orders;
  },
});

// Get orders with filters for admin
export const getOrdersWithFilters = query({
  args: {
    status: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    searchQuery: v.optional(v.string()),
    emailSearch: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("orders");

    // Apply status filter
    if (args.status) {
      query = query.filter(q => q.eq(q.field("status"), args.status));
    }

    // Apply date range filter
    if (args.startDate) {
      query = query.filter(q => q.gte(q.field("createdAt"), args.startDate));
    }
    if (args.endDate) {
      query = query.filter(q => q.lte(q.field("createdAt"), args.endDate));
    }

    // Apply search query filter (order number)
    if (args.searchQuery) {
      query = query.filter(q => 
        q.eq(q.field("orderNumber"), args.searchQuery)
      );
    }

    // Apply email search filter
    if (args.emailSearch) {
      query = query.filter(q => 
        q.eq(q.field("shippingDetails.email"), args.emailSearch)
      );
    }

    const orders = await query
      .order("desc")
      .take(args.limit || 100);

    return orders;
  },
});

// Get order statistics for admin dashboard
// OPTIMIZED: Added limit to prevent full collection scan
export const getOrderStats = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 1000;
    
    // OPTIMIZED: Use take() instead of collect()
    const orders = await ctx.db
      .query("orders")
      .order("desc")
      .take(limit);
    
    const today = new Date();
    const todayStr = today.toDateString();
    
    const stats = {
      total: orders.length,
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      totalRevenue: 0,
      todayOrders: 0,
    };
    
    // Single pass through orders for all stats
    orders.forEach(o => {
      switch (o.status) {
        case "pending": stats.pending++; break;
        case "confirmed": stats.confirmed++; break;
        case "shipped": stats.shipped++; break;
        case "delivered": stats.delivered++; break;
        case "cancelled": stats.cancelled++; break;
      }
      
      if (o.status !== "cancelled") {
        stats.totalRevenue += o.orderTotal;
      }
      
      if (new Date(o.createdAt).toDateString() === todayStr) {
        stats.todayOrders++;
      }
    });
    
    return stats;
  },
});

// Bulk update order status
export const bulkUpdateOrderStatus = mutation({
  args: {
    orderIds: v.array(v.id("orders")),
    status: v.string(),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updateData = {
      status: args.status,
      updatedAt: Date.now(),
    };
    
    // Add timestamp for specific status changes
    if (args.status === "shipped") {
      updateData.shippedAt = Date.now();
    } else if (args.status === "delivered") {
      updateData.deliveredAt = Date.now();
    }
    
    for (const orderId of args.orderIds) {
      await ctx.db.patch(orderId, updateData);
    }
    
    return { 
      success: true, 
      message: `Updated ${args.orderIds.length} orders to ${args.status}` 
    };
  },
});

// Cancel order with reason
export const cancelOrder = mutation({
  args: {
    orderId: v.id("orders"),
    reason: v.string(),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }
    
    // Add cancellation to delivery details
    const cancellationUpdate = {
      status: "cancelled",
      message: `Order cancelled: ${args.reason}`,
      timestamp: Date.now(),
      updatedBy: args.updatedBy || "admin",
    };
    
    const updatedDeliveryDetails = [
      ...(order.deliveryDetails || []),
      cancellationUpdate
    ];
    
    await ctx.db.patch(args.orderId, {
      status: "cancelled",
      deliveryDetails: updatedDeliveryDetails,
      updatedAt: Date.now(),
    });
    
    return { 
      success: true, 
      message: "Order cancelled successfully" 
    };
  },
});

// Add this function to your orders.js file
export const updateProductSalesOnOrderComplete = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) return;

    // Update sales count for each product in the order
    for (const item of order.items) {
      await ctx.runMutation(api.products.updateProductSalesCount, {
        productId: item.productId,
        quantity: item.quantity,
      });
    }
  },
});

// Update order with Shiprocket details
export const updateOrderWithShiprocket = mutation({
  args: {
    orderId: v.id("orders"),
    shiprocketDetails: v.optional(v.object({
      shiprocketOrderId: v.optional(v.number()),
      shipmentId: v.optional(v.number()),
      awbCode: v.optional(v.string()),
      courierCompanyId: v.optional(v.number()),
      courierName: v.optional(v.string()),
      trackingUrl: v.optional(v.string()),
      status: v.optional(v.string()),
      error: v.optional(v.string()),
    })),
    estimatedDeliveryDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const updateData = {
        updatedAt: Date.now(),
      };

      if (args.shiprocketDetails) {
        updateData.shiprocketDetails = {
          ...args.shiprocketDetails,
          createdAt: Date.now(),
        };
      }

      if (args.estimatedDeliveryDate) {
        updateData.estimatedDeliveryDate = args.estimatedDeliveryDate;
      }

      await ctx.db.patch(args.orderId, updateData);

      return {
        success: true,
        message: "Order updated with Shiprocket details",
      };
    } catch (error) {
      console.error("Error updating order with Shiprocket details:", error);
      throw new Error("Failed to update order with Shiprocket details");
    }
  },
});

// Get orders with Shiprocket details
export const getOrdersWithShiprocket = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    const orders = await ctx.db
      .query("orders")
      .order("desc")
      .take(limit);

    return orders.map(order => ({
      ...order,
      hasShiprocketOrder: !!order.shiprocketDetails?.shiprocketOrderId,
      shiprocketStatus: order.shiprocketDetails?.status || null,
      awbCode: order.shiprocketDetails?.awbCode || null,
      courierName: order.shiprocketDetails?.courierName || null,
    }));
  },
});

// Track order by order number OR phone number
export const trackOrder = query({
  args: {
    orderNumber: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.orderNumber && !args.phone) {
      return null;
    }

    if (args.orderNumber) {
      // Find exact order number
      const order = await ctx.db
        .query("orders")
        .withIndex("by_order_number", (q) => q.eq("orderNumber", args.orderNumber))
        .unique();
      if (order) return order;
    }

    if (args.phone) {
      // Clean phone number input
      const cleanPhone = args.phone.replace(/\D/g, "");
      if (cleanPhone.length >= 10) {
        // Query recent orders and scan for phone match
        const recentOrders = await ctx.db.query("orders").order("desc").take(150);
        const match = recentOrders.find(o => {
          const orderPhone = o.shippingDetails?.phone?.replace(/\D/g, "") || "";
          return orderPhone.endsWith(cleanPhone) || cleanPhone.endsWith(orderPhone);
        });
        if (match) return match;
      }
    }

    return null;
  },
});