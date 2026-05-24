import { NextResponse } from 'next/server';
import shiprocketAPI, { formatOrderForShiprocket } from '@/lib/shiprocket-api';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.CONVEX_SELF_HOSTED_URL || process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(request) {
  try {
    const { order } = await request.json();

    if (!order) {
      return NextResponse.json(
        { error: 'Order data is required' },
        { status: 400 }
      );
    }

    // Fetch dynamic packaging configuration from Convex
    let config = null;
    try {
      config = await convex.query(api.shiprocketConfig.getConfig);
    } catch (configError) {
      console.error('Error fetching Shiprocket dynamic config:', configError);
      // Fallback to defaults (formatOrderForShiprocket handles null config gracefully)
    }

    // Format order data for Shiprocket with custom configuration
    const shiprocketOrderData = formatOrderForShiprocket(order, config);

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