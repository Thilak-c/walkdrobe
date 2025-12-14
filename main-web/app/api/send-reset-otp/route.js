import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request) {
  try {
    const { email, otp, userName } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: "Email and OTP are required" },
        { status: 400 }
      );
    }

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

    // Mobile-optimized Email HTML template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
        <meta name="x-apple-disable-message-reformatting">
        <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
        <title>Password Reset OTP</title>
        <!--[if mso]>
        <style type="text/css">
          body, table, td {font-family: Arial, sans-serif !important;}
        </style>
        <![endif]-->
      </head>
      <body style="margin: 0; padding: 0; background-color: #111111; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        
        <!-- Wrapper Table -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #111111;">
          <tr>
            <td align="center" style="padding: 16px 12px;">
              
              <!-- Main Container -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 400px; background-color: #1a1a1a; border-radius: 20px; overflow: hidden;">
                
                <!-- Logo Section -->
                <tr>
                  <td align="center" style="padding: 28px 20px 20px;">
                    <img src="https://aesthetxways.com/fav.png" alt="AesthetX" width="56" height="56" style="width: 56px; height: 56px; border-radius: 14px; display: block; margin: 0 auto;">
                    <h1 style="color: #ffffff; margin: 16px 0 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">AesthetX Ways</h1>
                  </td>
                </tr>
                
                <!-- Greeting -->
                <tr>
                  <td align="center" style="padding: 0 24px;">
                    <p style="color: #888888; font-size: 15px; margin: 0; line-height: 1.5;">
                      Hey ${userName || "there"} 👋
                    </p>
                  </td>
                </tr>
                
                <!-- OTP Card -->
                <tr>
                  <td style="padding: 24px 16px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(135deg, #252525 0%, #1f1f1f 100%); border-radius: 16px; border: 1px solid #333333;">
                      <tr>
                        <td align="center" style="padding: 24px 16px;">
                          <p style="color: #666666; font-size: 11px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">
                            Your Reset Code
                          </p>
                          
                          <!-- OTP Display -->
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 12px auto;">
                            <tr>
                              ${otp.split('').map(digit => `
                                <td style="padding: 0 4px;">
                                  <div style="width: 42px; height: 52px; background: #2a2a2a; border-radius: 10px; border: 2px solid #404040; text-align: center; line-height: 52px;">
                                    <span style="font-size: 26px; font-weight: 700; color: #ffffff; font-family: 'SF Mono', 'Courier New', monospace;">${digit}</span>
                                  </div>
                                </td>
                              `).join('')}
                            </tr>
                          </table>
                          
                          <!-- Timer Badge -->
                          <div style="display: inline-block; background: #2d2d2d; border-radius: 20px; padding: 6px 14px; margin-top: 12px;">
                            <span style="color: #ff6b6b; font-size: 12px; font-weight: 600;">⏱ Expires in 10 min</span>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Message -->
                <tr>
                  <td align="center" style="padding: 0 24px 24px;">
                    <p style="color: #666666; font-size: 13px; margin: 0; line-height: 1.6;">
                      Enter this code to reset your password.<br>
                      <span style="color: #555555;">Didn't request this? Just ignore it.</span>
                    </p>
                  </td>
                </tr>
                
                <!-- Divider -->
                <tr>
                  <td style="padding: 0 24px;">
                    <div style="height: 1px; background: linear-gradient(90deg, transparent, #333333, transparent);"></div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td align="center" style="padding: 20px 24px 24px;">
                    <p style="color: #444444; font-size: 11px; margin: 0;">
                      © ${new Date().getFullYear()} AesthetX Ways
                    </p>
                    <p style="color: #333333; font-size: 10px; margin: 8px 0 0;">
                      This is an automated message
                    </p>
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
    await transporter.sendMail({
      from: `"AesthetX Ways" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `${otp} - Your Password Reset OTP`,
      html: htmlContent,
    });

    return NextResponse.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send OTP email" },
      { status: 500 }
    );
  }
}
