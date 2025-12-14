import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: "﻿​﻿smtp.hostinger.com", // or your provider’s SMTP host
      port: 465,
      secure: true, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(request) {
  try {
    const { 
      userEmail, 
      userName, 
      orderNumber, 
      orderItems, 
      orderTotal, 
      shippingDetails,
      paymentDetails 
    } = await request.json();

    if (!userEmail || !userName || !orderNumber || !orderItems || !orderTotal) {
      return NextResponse.json(
        { success: false, message: 'Missing required order details' },
        { status: 400 }
      );
    }

    // Format order items for email
    const itemsHtml = orderItems.map(item => `
      <div style="display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #e2e8f0;">
        <div style="width: 60px; height: 60px; background: #f8fafc; border-radius: 8px; margin-right: 15px; overflow: hidden;">
          <img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;" />
        </div>
        <div style="flex: 1;">
          <h4 style="margin: 0 0 5px 0; font-size: 16px; color: #1e293b; font-weight: 600;">${item.name}</h4>
          <p style="margin: 0; color: #64748b; font-size: 14px;">Size: ${item.size} | Qty: ${item.quantity}</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1e293b;">₹${item.price.toLocaleString()}</p>
        </div>
      </div>
    `).join('');

    // Calculate delivery date (3-5 business days)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5);
    const formattedDeliveryDate = deliveryDate.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Email content
    const mailOptions = {
      from: `AesthetX Ways <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `Order Confirmation`,
      html: `
<body style="margin:0; padding:0; background-color:#f8f9fa; font-family: Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f8f9fa">
      <tr>
        <td align="center">
          <!-- Wrapper -->
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background:#ffffff; border-radius:12px; overflow:hidden;">
            
            <!-- Header -->
            <tr>
              <td bgcolor="#000000" style="padding:32px; text-align:center; color:#ffffff; font-size:24px; font-weight:bold; letter-spacing:1px;">
                <span style="display:inline-flex; align-items:center; gap:8px;">
                  <!-- SVG Logo -->
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="white" viewBox="0 0 24 24">
                    <path d="M12 2L15.09 8.26 22 9.27l-5 4.87L18.18 22 
                    12 18.54 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  Order Confirmation
                </span>
              </td>
            </tr>

            <!-- Greeting -->
            <tr>
              <td style="padding:40px 32px 20px 32px; color:#111111; font-size:18px; font-weight:600;">
                Hi ${userName},
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px 32px; color:#555555; font-size:15px; line-height:1.6;">
                Thank you for your purchase! We’re processing your order and will notify you when it’s on the way.
              </td>
            </tr>

            <!-- Order Details -->
            <tr>
              <td style="padding:0 32px 24px 32px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb; border-radius:8px;">
                  <tr>
                    <td colspan="2" style="padding:16px; font-size:16px; font-weight:600; color:#111111; border-bottom:1px solid #e5e7eb;">
                      Order Summary
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:12px 16px; font-size:14px; color:#555;">Order Number</td>
                    <td style="padding:12px 16px; font-size:14px; color:#111; text-align:right; font-weight:600;">
                      ${orderNumber}
                    </td>
                  </tr>
                  ${itemsHtml}
                  <tr>
                    <td style="padding:12px 16px; font-size:14px; color:#555; font-weight:600;">Total</td>
                    <td style="padding:12px 16px; font-size:14px; color:#000; text-align:right; font-weight:bold;">
                      ${orderTotal}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Shipping Details -->
            <tr>
              <td style="padding:0 32px 24px 32px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb; border-radius:8px;">
                  <tr>
                    <td colspan="2" style="padding:16px; font-size:16px; font-weight:600; color:#111111; border-bottom:1px solid #e5e7eb;">
                      Shipping Details
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:12px 16px; font-size:14px; color:#555;">Name</td>
                    <td style="padding:12px 16px; font-size:14px; color:#111; text-align:right;">
                      ${userName}
                    </td>
                  </tr>  <tr>
                    <td style="padding:12px 16px; font-size:14px; color:#555;">Phone</td>
                    <td style="padding:12px 16px; font-size:14px; color:#111; text-align:right;">
                      ${shippingDetails.phone}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:12px 16px; font-size:14px; color:#555;">Address</td>
                    <td style="padding:12px 16px; font-size:14px; color:#111; text-align:right;">
                      ${shippingDetails.address}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:12px 16px; font-size:14px; color:#555;">City</td>
                    <td style="padding:12px 16px; font-size:14px; color:#111; text-align:right;">
                      ${shippingDetails.city}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:12px 16px; font-size:14px; color:#555;">Pincode</td>
                    <td style="padding:12px 16px; font-size:14px; color:#111; text-align:right;">
                      ${shippingDetails.pincode}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- CTA -->
            <tr>
              <td align="center" style="padding:24px;">
                <a href="https://aesthetxways.com/orders" 
                   style="background:#000000; color:#ffffff; text-decoration:none; padding:14px 28px; 
                          border-radius:6px; font-size:14px; font-weight:600; display:inline-block;">
                  Track Your Order
                </a>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:24px 32px; background:#f8f9fa; color:#999999; font-size:12px; text-align:center;">
                © ${new Date().getFullYear()} Your Brand. All rights reserved.
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>

      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: 'Order confirmation email sent successfully',
    });

  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return NextResponse.json(
      { success: false, message: error },
      { status: 500 }
    );
  }
}
