import { NextResponse } from 'next/server';
import shiprocketAPI from '@/lib/shiprocket-api';

export async function GET() {
  try {
    console.log('Fetching pickup locations...');
    
    // Get pickup locations
    const result = await shiprocketAPI.makeRequest('/settings/company/pickup');
    
    console.log('Pickup locations:', JSON.stringify(result, null, 2));
    
    return NextResponse.json({
      success: true,
      pickupLocations: result.data || result,
    });
    
  } catch (error) {
    console.error('Failed to fetch pickup locations:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}