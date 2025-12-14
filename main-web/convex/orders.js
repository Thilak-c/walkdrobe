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

// Calculate estimated delivery date (7 business days from order)
const calculateEstimatedDelivery = (orderDate = Date.now()) => {
  const deliveryDate = new Date(orderDate);
  
  // Add 7-10 business days
  let daysAdded = 0;
  let businessDaysAdded = 0;
  
  while (businessDaysAdded < 7) {
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
export const getUserOrders = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

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
export const getOrdersByStatus = query({
  args: {
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .collect();

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
export const getOrderStats = query({
  args: {},
  handler: async (ctx) => {
    const orders = await ctx.db.query("orders").collect();
    
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === "pending").length,
      confirmed: orders.filter(o => o.status === "confirmed").length,
      shipped: orders.filter(o => o.status === "shipped").length,
      delivered: orders.filter(o => o.status === "delivered").length,
      cancelled: orders.filter(o => o.status === "cancelled").length,
      totalRevenue: orders
        .filter(o => o.status !== "cancelled")
        .reduce((sum, o) => sum + o.orderTotal, 0),
      todayOrders: orders.filter(o => {
        const today = new Date();
        const orderDate = new Date(o.createdAt);
        return orderDate.toDateString() === today.toDateString();
      }).length,
    };
    
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