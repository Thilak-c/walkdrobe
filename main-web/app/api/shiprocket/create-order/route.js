import { NextResponse } from 'next/server';
import shiprocketAPI, { formatOrderForShiprocket } from '@/lib/shiprocket-api';

export async function POST(request) {
  try {
    const { order } = await request.json();

    if (!order) {
      return NextResponse.json(
        { error: 'Order data is required' },
        { status: 400 }
      );
    }

    // Format order data for Shiprocket
    const shiprocketOrderData = formatOrderForShiprocket(order);

    // Create order in Shiprocket
    const shiprocketResponse = await shiprocketAPI.createOrder(shiprocketOrderData);

    return NextResponse.json({
      success: true,
      shiprocketOrderId: shiprocketResponse.order_id,
      shipmentId: shiprocketResponse.shipment_id,
      awbCode: shiprocketResponse.awb_code,
      courierCompanyId: shiprocketResponse.courier_company_id,
      courierName: shiprocketResponse.courier_name,
      message: 'Shiprocket order created successfully',
      data: shiprocketResponse,
    });
  } catch (error) {
    console.error('Error creating Shiprocket order:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create Shiprocket order',
      details: error.stack,
    }, { status: 500 });
  }
}