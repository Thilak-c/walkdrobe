import { v } from "convex/values";
import { mutation, action, query } from "./_generated/server";
import { api } from "./_generated/api";
import { createOrderNotificationTemplate } from "./emailService";

// Send order notification email
export const sendOrderNotificationEmail = action({
  args: {
    orderData: v.object({
      orderNumber: v.string(),
      customerName: v.string(),
      customerEmail: v.string(),
      orderTotal: v.number(),
      items: v.array(v.object({
        name: v.string(),
        quantity: v.number(),
        price: v.number(),
        size: v.optional(v.string()),
        image: v.optional(v.string()),
      })),
      shippingAddress: v.string(),
      shippingDetails: v.optional(v.any()),
      paymentDetails: v.optional(v.any()),
    }),
  },
  handler: async (ctx, args) => {
    const { orderData } = args;

    console.log('Sending admin notification for order:', orderData.orderNumber);

    try {
      // Call the Next.js API route to send admin notification
      const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      console.log('Calling admin notification API:', `${apiUrl}/api/send-admin-notification`);

      const payload = {
        orderNumber: orderData.orderNumber,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        orderTotal: orderData.orderTotal,
        items: orderData.items,
        shippingAddress: orderData.shippingAddress,
        shippingDetails: orderData.shippingDetails || {
          phone: '',
          address: orderData.shippingAddress,
          city: '',
          state: '',
          pincode: '',
        },
        paymentDetails: orderData.paymentDetails || {
          status: 'pending',
          paymentMethod: 'online',
        },
      };

      console.log('Payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(`${apiUrl}/api/send-admin-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('API response status:', response.status);

      const result = await response.json();
      console.log('API response:', result);

      // Log the notification
      const adminEmails = ["yashodanandkumar15@gmail.com", "maskeyishere@gmail.com"];
      for (const adminEmail of adminEmails) {
        await ctx.runMutation(api.emailNotifications.logOrderNotification, {
          orderNumber: orderData.orderNumber,
          customerEmail: orderData.customerEmail,
          adminEmail: adminEmail,
          status: result.success ? "sent" : "failed",
          error: result.success ? undefined : result.message,
        });
      }

      return result;
    } catch (error) {
      // Log the failed notification for all admins
      const adminEmails = ["yashodanandkumar15@gmail.com", "maskeyishere@gmail.com"];
      for (const adminEmail of adminEmails) {
        await ctx.runMutation(api.emailNotifications.logOrderNotification, {
          orderNumber: orderData.orderNumber,
          customerEmail: orderData.customerEmail,
          adminEmail: adminEmail,
          status: "failed",
          error: error.message,
        });
      }

      return { success: false, error: error.message };
    }
  },
});



// Log order notification (for tracking)
export const logOrderNotification = mutation({
  args: {
    orderNumber: v.string(),
    customerEmail: v.string(),
    adminEmail: v.string(),
    status: v.string(), // 'sent', 'failed'
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert("emailNotifications", {
      type: "order_notification",
      orderNumber: args.orderNumber,
      recipientEmail: args.adminEmail,
      subject: `New Order - ${args.orderNumber}`,
      status: args.status,
      error: args.error,
      sentAt: new Date().toISOString(),
      metadata: {
        customerEmail: args.customerEmail,
        notificationType: "admin_order_alert",
      },
    });

    return { success: true, notificationId };
  },
});// G·et email notification history
export const getEmailNotifications = query({
  args: {
    type: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("emailNotifications");

    if (args.type) {
      query = query.withIndex("by_type", (q) => q.eq("type", args.type));
    } else if (args.status) {
      query = query.withIndex("by_status", (q) => q.eq("status", args.status));
    } else {
      query = query.withIndex("by_sent_at");
    }

    const notifications = await query
      .order("desc")
      .take(args.limit || 50);

    return notifications;
  },
});

// Get email notification stats
export const getEmailNotificationStats = query({
  args: {},
  handler: async (ctx) => {
    const notifications = await ctx.db.query("emailNotifications").collect();

    const stats = {
      total: notifications.length,
      sent: notifications.filter(n => n.status === "sent").length,
      failed: notifications.filter(n => n.status === "failed").length,
      pending: notifications.filter(n => n.status === "pending").length,
      byType: {},
      todayCount: 0,
    };

    // Count by type
    notifications.forEach(notification => {
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
    });

    // Count today's notifications
    const today = new Date().toDateString();
    stats.todayCount = notifications.filter(n =>
      new Date(n.sentAt).toDateString() === today
    ).length;

    return stats;
  },
});