import { NextResponse } from 'next/server';
import shiprocketAPI from '@/lib/shiprocket-api';

export async function GET() {
  try {
    console.log('Fetching Shiprocket orders...');
    
    // Get recent orders
    const result = await shiprocketAPI.makeRequest('/orders');
    
    console.log('Shiprocket orders:', JSON.stringify(result, null, 2));
    
    return NextResponse.json({
      success: true,
      orders: result.data || result,
      totalOrders: result.data ? result.data.length : 0,
    });
    
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}