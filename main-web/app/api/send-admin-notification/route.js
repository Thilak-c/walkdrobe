import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Received admin notification request:', JSON.stringify(body, null, 2));

    const {
      orderNumber,
      customerName,
      customerEmail,
      orderItems,
      orderTotal,
      shippingDetails,
      paymentDetails,
      items // Also accept 'items' as alternative
    } = body;

    // Use items if orderItems is not provided
    const finalItems = orderItems || items;

    if (!orderNumber || !customerName || !finalItems || !orderTotal) {
      console.error('Missing required fields:', {
        hasOrderNumber: !!orderNumber,
        hasCustomerName: !!customerName,
        hasItems: !!finalItems,
        hasOrderTotal: !!orderTotal
      });
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required order details',
          missing: {
            orderNumber: !orderNumber,
            customerName: !customerName,
            items: !finalItems,
            orderTotal: !orderTotal
          }
        },
        { status: 400 }
      );
    }

    // Admin emails to notify
    const adminEmails = [
      "aesthetxways07@gmail.com",
      'yashodanandkumar15@gmail.com',
      'thilak8797@gmail.com',
      'maskeyishere@gmail.com'
    ];

    // Format order items for email
    const itemsHtml = finalItems.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <strong>${item.name}</strong><br>
          <span style="color: #64748b; font-size: 14px;">Size: ${item.size}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${item.price.toLocaleString()}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">₹${(item.quantity * item.price).toLocaleString()}</td>
      </tr>
    `).join('');

    // Email content for admin
    const adminMailOptions = {
      from: `AesthetX Ways Orders <${process.env.EMAIL_USER}>`,
      to: adminEmails.join(', '),
      subject: `🛍️ New Order - ${orderNumber} - ₹${orderTotal.toLocaleString()}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Order - ${orderNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f3f4f6">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td bgcolor="#000000" style="padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                🛍️ New Order Received
              </h1>
              <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 14px;">
                AesthetX Ways - Admin Notification
              </p>
            </td>
          </tr>

          <!-- Alert Box -->
          <tr>
            <td style="padding: 24px 32px;">
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 600;">
                  ⚡ Action Required: Process this order immediately
                </p>
              </div>
            </td>
          </tr>

          <!-- Order Info -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f9fafb; border-radius: 8px; padding: 20px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Order Number</p>
                    <p style="margin: 0; color: #111827; font-size: 20px; font-weight: bold;">${orderNumber}</p>
                  </td>
                  <td align="right">
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Order Date</p>
                    <p style="margin: 0; color: #111827; font-size: 16px; font-weight: 600;">
                      ${new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short'
      })}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Customer Details -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">
                👤 Customer Information
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e5e7eb; border-radius: 8px;">
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 14px;">Name:</span>
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <strong style="color: #111827;">${customerName}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 14px;">Email:</span>
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <a href="mailto:${customerEmail}" style="color: #2563eb; text-decoration: none;">${customerEmail}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 14px;">Phone:</span>
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <a href="tel:${shippingDetails.phone}" style="color: #2563eb; text-decoration: none;">${shippingDetails.phone}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px;">
                    <span style="color: #6b7280; font-size: 14px;">Shipping Address:</span>
                  </td>
                  <td style="padding: 12px 16px; text-align: right;">
                    <span style="color: #111827; font-size: 14px;">
                      ${shippingDetails.address}, ${shippingDetails.city}<br>
                      ${shippingDetails.state} - ${shippingDetails.pincode}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Order Items -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">
                📦 Order Items
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e5e7eb; border-radius: 8px;">
                <thead>
                  <tr style="background: #f9fafb;">
                    <th style="padding: 12px; text-align: left; color: #6b7280; font-size: 14px; font-weight: 600;">Product</th>
                    <th style="padding: 12px; text-align: center; color: #6b7280; font-size: 14px; font-weight: 600;">Qty</th>
                    <th style="padding: 12px; text-align: right; color: #6b7280; font-size: 14px; font-weight: 600;">Price</th>
                    <th style="padding: 12px; text-align: right; color: #6b7280; font-size: 14px; font-weight: 600;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr style="background: #f9fafb;">
                    <td colspan="3" style="padding: 16px; text-align: right; font-weight: 600; color: #111827; font-size: 16px;">
                      Order Total:
                    </td>
                    <td style="padding: 16px; text-align: right; font-weight: bold; color: #000000; font-size: 18px;">
                      ₹${orderTotal.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </td>
          </tr>

          <!-- Payment Details -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">
                💳 Payment Information
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e5e7eb; border-radius: 8px;">
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 14px;">Payment Method:</span>
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <strong style="color: #111827; text-transform: uppercase;">${paymentDetails.paymentMethod || 'Online'}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px;">
                    <span style="color: #6b7280; font-size: 14px;">Payment Status:</span>
                  </td>
                  <td style="padding: 12px 16px; text-align: right;">
                    <span style="display: inline-block; padding: 4px 12px; background: ${paymentDetails.status === 'paid' ? '#dcfce7' : '#fef3c7'}; color: ${paymentDetails.status === 'paid' ? '#166534' : '#92400e'}; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                      ${paymentDetails.status || 'Pending'}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Action Steps -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px;">
                <h3 style="margin: 0 0 12px 0; color: #1e40af; font-size: 16px; font-weight: 600;">
                  📋 Next Steps
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px; line-height: 1.8;">
                  <li>Log in to admin panel to view full order details</li>
                  <li>Verify payment and update order status</li>
                  <li>Process inventory and prepare items for shipping</li>
                  <li>Update customer with tracking information</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 0 32px 32px 32px;">
              <a href="https://aesthetxways.com/admin/orders" 
                 style="display: inline-block; background: #000000; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                View Order in Admin Panel →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px;">
                This is an automated notification from AesthetX Ways
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} AesthetX Ways. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    };

    // Send email to all admins
    await transporter.sendMail(adminMailOptions);

    return NextResponse.json({
      success: true,
      message: 'Admin notification emails sent successfully',
      sentTo: adminEmails,
    });

  } catch (error) {
    console.error('Error sending admin notification email:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
