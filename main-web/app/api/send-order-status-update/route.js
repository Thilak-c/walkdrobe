import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request) {
  try {
    const {
      customerEmail,
      customerName,
      orderNumber,
      status,
      items,
      orderTotal,
      shippingDetails,
      paymentDetails,
      deliveryDetails,
      createdAt,
      estimatedDeliveryDate,
    } = await request.json();

    console.log("Sending order status update email to:", customerEmail);
    console.log("Order:", orderNumber, "Status:", status);

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Status messages
    const statusMessages = {
      pending: {
        title: "Order Pending",
        message: "Your order is pending and will be processed soon.",
        color: "#F59E0B",
      },
      confirmed: {
        title: "Order Confirmed",
        message: "Your order has been confirmed and is being processed.",
        color: "#10B981",
      },
      processing: {
        title: "Order Processing",
        message: "Your order is currently being processed.",
        color: "#3B82F6",
      },
      shipped: {
        title: "Order Shipped",
        message: "Great news! Your order has been shipped and is on its way to you.",
        color: "#8B5CF6",
      },
      out_for_delivery: {
        title: "Out for Delivery",
        message: "Your order is out for delivery and will reach you soon!",
        color: "#F59E0B",
      },
      delivered: {
        title: "Order Delivered",
        message: "Your order has been successfully delivered. Thank you for shopping with us!",
        color: "#059669",
      },
      cancelled: {
        title: "Order Cancelled",
        message: "Your order has been cancelled. If you have any questions, please contact our support team.",
        color: "#EF4444",
      },
    };

    const statusInfo = statusMessages[status] || {
      title: "Order Status Updated",
      message: `Your order status has been updated to: ${status}`,
      color: "#6B7280",
    };

    // Email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Status Update</title>
  <style>
    @media only screen and (max-width: 600px) {
      .wrapper { width: 100% !important; }
      .content { padding: 16px !important; }
      .header { padding: 20px 16px !important; font-size: 18px !important; }
      .greeting { padding: 24px 16px 12px 16px !important; font-size: 16px !important; }
      .message { padding: 0 16px 20px 16px !important; font-size: 13px !important; }
      .section { padding: 0 16px 16px 16px !important; }
      .table-header { padding: 12px !important; font-size: 14px !important; }
      .table-row { padding: 10px 12px !important; font-size: 12px !important; }
      .product-img { width: 50px !important; height: 50px !important; }
      .cta-button { padding: 12px 24px !important; font-size: 13px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f8f9fa">
    <tr>
      <td align="center" style="padding:10px;">
        <!-- Wrapper -->
        <table class="wrapper" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td class="header" bgcolor="#000000" style="padding:24px 20px; text-align:center; color:#ffffff; font-size:20px; font-weight:600; letter-spacing:0.5px;">
              ${statusInfo.title}
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td class="greeting" style="padding:32px 24px 16px 24px; color:#111111; font-size:16px; font-weight:600;">
              Hi ${customerName},
            </td>
          </tr>
          <tr>
            <td class="message" style="padding:0 24px 24px 24px; color:#555555; font-size:14px; line-height:1.5;">
              ${statusInfo.message}
            </td>
          </tr>

          <!-- Order Details -->
          <tr>
            <td class="section" style="padding:0 24px 20px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb; border-radius:8px;">
                <tr>
                  <td class="table-header" colspan="2" style="padding:14px; font-size:15px; font-weight:600; color:#111111; border-bottom:1px solid #e5e7eb;">
                    Order Details
                  </td>
                </tr>
                <tr>
                  <td class="table-row" style="padding:10px 14px; font-size:13px; color:#666;">Order Number</td>
                  <td class="table-row" style="padding:10px 14px; font-size:13px; color:#111; text-align:right; font-weight:600;">
                    ${orderNumber}
                  </td>
                </tr>
                <tr>
                  <td class="table-row" style="padding:10px 14px; font-size:13px; color:#666;">Status</td>
                  <td class="table-row" style="padding:10px 14px; text-align:right;">
                    <span style="display:inline-block; padding:3px 10px; background-color:${statusInfo.color}; color:#ffffff; border-radius:10px; font-size:11px; font-weight:600; text-transform:uppercase;">
                      ${status.replace(/_/g, " ")}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td class="table-row" style="padding:10px 14px; font-size:13px; color:#666; font-weight:600;">Total</td>
                  <td class="table-row" style="padding:10px 14px; font-size:14px; color:#000; text-align:right; font-weight:bold;">
                    ₹${orderTotal.toLocaleString()}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items -->
          <tr>
            <td class="section" style="padding:0 24px 20px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb; border-radius:8px;">
                <tr>
                  <td class="table-header" colspan="2" style="padding:14px; font-size:15px; font-weight:600; color:#111111; border-bottom:1px solid #e5e7eb;">
                    Order Items
                  </td>
                </tr>
                ${items
                  .map(
                    (item) => `
                <tr>
                  <td colspan="2" style="padding:12px 14px; border-bottom:1px solid #e5e7eb;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width:50px; vertical-align:top;">
                          <div class="product-img" style="width:50px; height:50px; background:#f8fafc; border-radius:6px; overflow:hidden;">
                            <img src="${item.image}" alt="${item.name}" style="width:100%; height:100%; object-fit:cover;" />
                          </div>
                        </td>
                        <td style="padding-left:12px; vertical-align:top;">
                          <div style="color:#111827; font-size:13px; font-weight:500; margin-bottom:3px; line-height:1.3;">${item.name}</div>
                          <div style="color:#6b7280; font-size:11px;">Size: ${item.size} | Qty: ${item.quantity}</div>
                        </td>
                        <td style="text-align:right; vertical-align:top; white-space:nowrap; padding-left:8px;">
                          <div style="color:#111827; font-size:13px; font-weight:600;">₹${item.price.toLocaleString()}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                `
                  )
                  .join("")}
              </table>
            </td>
          </tr>

          <!-- Shipping Details -->
          ${shippingDetails ? `
          <tr>
            <td class="section" style="padding:0 24px 20px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb; border-radius:8px;">
                <tr>
                  <td class="table-header" colspan="2" style="padding:14px; font-size:15px; font-weight:600; color:#111111; border-bottom:1px solid #e5e7eb;">
                    Shipping Details
                  </td>
                </tr>
                <tr>
                  <td class="table-row" style="padding:10px 14px; font-size:13px; color:#666;">Name</td>
                  <td class="table-row" style="padding:10px 14px; font-size:13px; color:#111; text-align:right;">
                    ${shippingDetails.fullName}
                  </td>
                </tr>
                <tr>
                  <td class="table-row" style="padding:10px 14px; font-size:13px; color:#666;">Phone</td>
                  <td class="table-row" style="padding:10px 14px; font-size:13px; color:#111; text-align:right;">
                    ${shippingDetails.phone}
                  </td>
                </tr>
                <tr>
                  <td class="table-row" style="padding:10px 14px; font-size:13px; color:#666;">Address</td>
                  <td class="table-row" style="padding:10px 14px; font-size:12px; color:#111; text-align:right; line-height:1.4;">
                    ${shippingDetails.address}, ${shippingDetails.city}, ${shippingDetails.state} - ${shippingDetails.pincode}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Payment Details -->
          ${paymentDetails ? `
          <tr>
            <td class="section" style="padding:0 24px 20px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb; border-radius:8px;">
                <tr>
                  <td class="table-header" colspan="2" style="padding:14px; font-size:15px; font-weight:600; color:#111111; border-bottom:1px solid #e5e7eb;">
                    Payment Info
                  </td>
                </tr>
                <tr>
                  <td class="table-row" style="padding:10px 14px; font-size:13px; color:#666;">Method</td>
                  <td class="table-row" style="padding:10px 14px; font-size:13px; color:#111; text-align:right; text-transform:uppercase;">
                    ${paymentDetails.paymentMethod || 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td class="table-row" style="padding:10px 14px; font-size:13px; color:#666;">Status</td>
                  <td class="table-row" style="padding:10px 14px; font-size:13px; color:#111; text-align:right; text-transform:capitalize;">
                    ${paymentDetails.status || 'N/A'}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Delivery Tracking -->
          ${deliveryDetails && deliveryDetails.length > 0 ? `
          <tr>
            <td class="section" style="padding:0 24px 20px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb; border-radius:8px;">
                <tr>
                  <td class="table-header" style="padding:14px; font-size:15px; font-weight:600; color:#111111; border-bottom:1px solid #e5e7eb;">
                    Delivery Tracking
                  </td>
                </tr>
                ${deliveryDetails.map((detail, index) => `
                <tr>
                  <td style="padding:12px 14px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width:28px; vertical-align:top;">
                          <div style="width:24px; height:24px; background:${index === deliveryDetails.length - 1 ? statusInfo.color : '#e5e7eb'}; border-radius:50%; text-align:center; line-height:24px;">
                            <span style="color:#ffffff; font-size:12px; font-weight:bold;">✓</span>
                          </div>
                        </td>
                        <td style="padding-left:10px; vertical-align:top;">
                          <div style="color:#111827; font-size:13px; font-weight:600; margin-bottom:3px; text-transform:capitalize; line-height:1.3;">
                            ${detail.status.replace(/_/g, ' ')}
                          </div>
                          <div style="color:#6b7280; font-size:11px; margin-bottom:2px; line-height:1.3;">
                            ${detail.message}
                          </div>
                          ${detail.location ? `<div style="color:#6b7280; font-size:11px; line-height:1.3;">📍 ${detail.location}</div>` : ''}
                          <div style="color:#9ca3af; font-size:10px; margin-top:3px;">
                            ${new Date(detail.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ${index < deliveryDetails.length - 1 ? '<tr><td style="padding:0 14px;"><div style="width:2px; height:16px; background:#e5e7eb; margin-left:11px;"></div></td></tr>' : ''}
                `).join('')}
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:20px 24px;">
              <a class="cta-button" href="${process.env.NEXT_PUBLIC_BASE_URL || "https://aesthetxways.com"}/orders" 
                 style="background:#000000; color:#ffffff; text-decoration:none; padding:12px 28px; 
                        border-radius:6px; font-size:13px; font-weight:600; display:inline-block;">
                Track Your Order
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 24px; background:#f8f9fa; color:#999999; font-size:11px; text-align:center; line-height:1.4;">
              © ${new Date().getFullYear()} AesthetX Ways. All rights reserved.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Send email
    const info = await transporter.sendMail({
      from: `"AesthetX Ways" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `${statusInfo.title} - Order #${orderNumber}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", info.messageId);

    return NextResponse.json({
      success: true,
      message: "Order status update email sent successfully",
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("Error sending order status update email:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to send order status update email",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
