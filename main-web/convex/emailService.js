// Email service configuration and utilities
import { action } from "./_generated/server";
import { v } from "convex/values";

// Send email using Next.js API route
export const sendEmail = action({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
    from: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // This is a placeholder - actual email sending happens via Next.js API routes
      // which have access to environment variables
      return { success: true, message: "Email will be sent via API route" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
});

// Create email templates
export const createOrderNotificationTemplate = (orderData) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Order - ${orderData.orderNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #000; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; }
        .order-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .items-table th, .items-table td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        .items-table th { background: #f5f5f5; font-weight: bold; }
        .total { font-size: 18px; font-weight: bold; color: #000; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .highlight { background: #fff3cd; padding: 10px; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🛍️ New Order Received</h1>
          <p>Walkdrobe - Order Management</p>
        </div>
        
        <div class="content">
          <div class="highlight">
            <strong>Order Number:</strong> ${orderData.orderNumber}<br>
            <strong>Order Date:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
          </div>
          
          <div class="order-details">
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> ${orderData.customerName}</p>
            <p><strong>Email:</strong> ${orderData.customerEmail}</p>
            <p><strong>Shipping Address:</strong><br>${orderData.shippingAddress}</p>
          </div>

          <div class="order-details">
            <h3>Order Items</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${orderData.items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>₹${item.price.toLocaleString()}</td>
                    <td>₹${(item.quantity * item.price).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="total">
              Total Order Value: ₹${orderData.orderTotal.toLocaleString()}
            </div>
          </div>

          <div class="order-details">
            <h3>Next Steps</h3>
            <ul>
              <li>Log in to your admin panel to view full order details</li>
              <li>Process the order and update inventory</li>
              <li>Prepare items for shipping</li>
              <li>Update order status and tracking information</li>
            </ul>
          </div>
        </div>

        <div class="footer">
          <p>This is an automated notification from Walkdrobe</p>
          <p>Please do not reply to this email</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send order confirmation to customer (optional)
export const sendCustomerOrderConfirmation = action({
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
      })),
      shippingAddress: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const customerEmailTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation - ${args.orderData.orderNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #000; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .highlight { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Order Confirmed!</h1>
            <p>Thank you for shopping with Walkdrobe</p>
          </div>
          
          <div class="content">
            <div class="highlight">
              <h3>Hi ${args.orderData.customerName},</h3>
              <p>Your order <strong>${args.orderData.orderNumber}</strong> has been confirmed!</p>
              <p>We'll send you updates as your order is processed and shipped.</p>
            </div>
            
            <h3>Order Summary</h3>
            <ul>
              ${args.orderData.items.map(item => `
                <li>${item.name} - Qty: ${item.quantity} - ₹${(item.quantity * item.price).toLocaleString()}</li>
              `).join('')}
            </ul>
            
            <p><strong>Total: ₹${args.orderData.orderTotal.toLocaleString()}</strong></p>
            
            <p>Shipping to:<br>${args.orderData.shippingAddress}</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://walkdrobe.in'}/track-order?orderId=${args.orderData.orderNumber}" 
                 style="display: inline-block; background: #000; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Track Your Order
              </a>
            </div>
            
            <p>Thank you for choosing Walkdrobe!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await ctx.runAction(api.emailService.sendEmail, {
      to: args.orderData.customerEmail,
      subject: `Order Confirmation - ${args.orderData.orderNumber}`,
      html: customerEmailTemplate,
    });
  },
});