import { NextResponse } from 'next/server';
import shiprocketAPI from '@/lib/shiprocket-api';

export async function GET() {
  try {
    // Test authentication
    const token = await shiprocketAPI.authenticate();
    
    return NextResponse.json({
      success: true,
      message: 'Shiprocket authentication successful',
      tokenLength: token.length,
      tokenPreview: token.substring(0, 50) + '...',
    });
  } catch (error) {
    console.error('Shiprocket test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Shiprocket authentication failed',
    }, { status: 500 });
  }
}