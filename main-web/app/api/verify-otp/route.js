import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, otp } = await request.json();
    
    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Get stored OTP data
    if (!global.otpStore && !global.otpStorePersistent) {
      return NextResponse.json(
        { success: false, message: 'No OTP found. Please request a new one.' },
        { status: 400 }
      );
    }

    // Try to get OTP from both stores
    let storedData = global.otpStore?.get(email) || global.otpStorePersistent?.get(email);

    if (!storedData) {
      return NextResponse.json(
        { success: false, message: 'No OTP found. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if OTP has expired
    const now = Date.now();
    const isExpired = now > storedData.expiresAt;
    
    if (isExpired) {
      global.otpStore?.delete(email);
      global.otpStorePersistent?.delete(email);
      return NextResponse.json(
        { success: false, message: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify OTP
    const isOtpValid = storedData.otp === otp;
    
    if (!isOtpValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid OTP. Please check and try again.' },
        { status: 400 }
      );
    }

    // OTP is valid - remove it from both stores
    global.otpStore?.delete(email);
    global.otpStorePersistent?.delete(email);

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
} 