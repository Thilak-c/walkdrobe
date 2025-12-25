import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request) {
  try {
    const { email, otp } = await request.json();
    
    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Read persisted OTPs
    const filePath = path.resolve(process.cwd(), 'main-web', 'uploads_files', 'otps.json');
    let current = [];
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      current = JSON.parse(raw || '[]');
    } catch (e) {
      current = [];
    }

    const storedData = current.find((o) => o.email === email);
    if (!storedData) {
      return NextResponse.json({ success: false, message: 'No OTP found. Please request a new one.' }, { status: 400 });
    }

    const now = Date.now();
    if (!storedData.expiresAt || now > storedData.expiresAt) {
      // remove expired
      const filtered = current.filter((o) => o.email !== email && (!o.expiresAt || o.expiresAt > now));
      try { await fs.writeFile(filePath, JSON.stringify(filtered, null, 2), 'utf8'); } catch (e) { console.error('Failed to update otps file', e); }
      return NextResponse.json({ success: false, message: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    if (storedData.otp !== otp) {
      return NextResponse.json({ success: false, message: 'Invalid OTP. Please check and try again.' }, { status: 400 });
    }

    // Valid OTP - remove it from persisted store
    const remaining = current.filter((o) => o.email !== email);
    try { await fs.writeFile(filePath, JSON.stringify(remaining, null, 2), 'utf8'); } catch (e) { console.error('Failed to remove used otp', e); }

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