// app/api/send-reply/route.js
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Configure email transporter (same as order confirmation)
const transporter = nodemailer.createTransport({
  host: "​smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(req) {
  try {
    const { to, name, originalMessage, reply } = await req.json();

    // Validation
    if (!to || !name || !reply) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Email content
    const mailOptions = {
      from: `AesthetX Ways <${process.env.EMAIL_USER}>`,
      to: to,
      subject: 'Re: Your message to AESTHETX WAYS',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: #000;
              color: #fff;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border: 1px solid #e0e0e0;
            }
            .original-message {
              background: #fff;
              border-left: 4px solid #000;
              padding: 15px;
              margin: 20px 0;
              font-size: 14px;
              color: #666;
            }
            .reply {
              background: #fff;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              padding: 20px;
              font-size: 12px;
              color: #999;
              border-top: 1px solid #e0e0e0;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: #000;
              color: #fff;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; font-weight: 300;">AESTHETX WAYS</h1>
          </div>
          
          <div class="content">
            <p>Hi ${name},</p>
            <p>Thank you for reaching out to us! Here's our response to your message:</p>
            
            <div class="original-message">
              <strong>Your Message:</strong><br>
              ${originalMessage}
            </div>
            
            <div class="reply">
              <strong>Our Reply:</strong><br><br>
              ${reply.replace(/\n/g, '<br>')}
            </div>
            
            <p>If you have any more questions, feel free to reply to this email or contact us at:</p>
            <ul style="list-style: none; padding: 0;">
              <li>📧 Email: team@aesthetxways.com</li>
              <li>📞 Phone: +91 7033769997</li>
              <li>📸 Instagram: @aesthetx.ways_</li>
            </ul>
            
            <a href="https://aesthetxways.com" class="button">Visit Our Website</a>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} AESTHETX WAYS. All rights reserved.</p>
            <p>This email was sent in response to your inquiry.</p>
          </div>
        </body>
        </html>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      ok: true,
      message: 'Reply sent successfully'
    });

  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json({
      error: 'Failed to send email. Please check your email configuration.'
    }, { status: 500 });
  }
}
