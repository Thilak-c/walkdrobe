import { NextResponse } from 'next/server';
import shiprocketAPI, { formatOrderForShiprocket } from '@/lib/shiprocket-api';

// Helper functions for Convex API calls
async function queryConvex(functionName, args) {
  const response = await fetch(`${process.env.CONVEX_SELF_HOSTED_URL}/api/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Convex ${process.env.CONVEX_SELF_HOSTED_ADMIN_KEY}`,
    },
    body: JSON.stringify({
      path: functionName,
      args: args,
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Convex query failed: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  const data = await response.json();
  return data.value;
}

async function mutateConvex(functionName, args) {
  const response = await fetch(`${process.env.CONVEX_SELF_HOSTED_URL}/api/mutation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Convex ${process.env.CONVEX_SELF_HOSTED_ADMIN_KEY}`,
    },
    body: JSON.stringify({
      path: functionName,
      args: args,
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Convex mutation failed: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  return await response.json();
}

export async function POST(request) {
  let orderNumber;
  
  try {
    const body = await request.json();
    orderNumber = body.orderNumber;

    if (!orderNumber) {
      return NextResponse.json(
        { error: 'Order number is required' },
        { status: 400 }
      );
    }

    // Get order details from database
    const order = await queryConvex('orders:getOrderByNumber', { orderNumber });
    
    if (!order) {
      return NextResponse.json(
        { error: `Order not found: ${orderNumber}` },
        { status: 404 }
      );
    }

    // Skip if Shiprocket order already exists
    if (order.shiprocketDetails?.shiprocketOrderId) {
      return NextResponse.json({
        success: true,
        message: 'Shiprocket order already exists',
        shiprocketOrderId: order.shiprocketDetails.shiprocketOrderId,
      });
    }

    // Fetch dynamic packaging configuration from Convex
    let config = null;
    try {
      config = await queryConvex('shiprocketConfig:getConfig', {});
    } catch (configError) {
      console.log('Error fetching Shiprocket dynamic config:', configError.message);
    }

    // Create Shiprocket order directly via API
    const shiprocketOrderData = formatOrderForShiprocket(order, config);
    const result = await shiprocketAPI.createOrder(shiprocketOrderData);

    // Get actual delivery estimate from Shiprocket serviceability
    let actualDeliveryEstimate = null;
    try {
      const serviceabilityResponse = await shiprocketAPI.checkServiceability(
        process.env.SHIPROCKET_PICKUP_PINCODE || '800002',
        order.shippingDetails.pincode,
        0.5
      );
      
      const availableCouriers = serviceabilityResponse.data?.available_courier_companies || [];
      if (availableCouriers.length > 0) {
        const estimatedDays = availableCouriers[0]?.etd;
        if (estimatedDays) {
          // Calculate actual delivery date based on Shiprocket's estimate
          const deliveryDate = new Date();
          deliveryDate.setDate(deliveryDate.getDate() + parseInt(estimatedDays));
          actualDeliveryEstimate = deliveryDate.getTime();
          console.log(`📅 Shiprocket delivery estimate: ${estimatedDays} days (${new Date(actualDeliveryEstimate).toLocaleDateString('en-IN')})`);
        }
      }
    } catch (serviceError) {
      console.log('Could not get delivery estimate from Shiprocket:', serviceError.message);
    }

    // Update order in database with Shiprocket details and correct delivery estimate
    const updateData = {
      shiprocketDetails: {
        shiprocketOrderId: result.data?.order_id || result.order_id,
        shipmentId: result.data?.shipment_id || result.shipment_id,
        awbCode: result.data?.awb_code || result.awb_code,
        courierCompanyId: result.data?.courier_company_id || result.courier_company_id,
        courierName: result.data?.courier_name || result.courier_name,
        trackingUrl: (result.data?.awb_code || result.awb_code) ? `https://shiprocket.co/tracking/${result.data?.awb_code || result.awb_code}` : undefined,
        status: 'created',
      },
    };

    // Update delivery estimate if we got one from Shiprocket
    if (actualDeliveryEstimate) {
      updateData.estimatedDeliveryDate = actualDeliveryEstimate;
    }

    await mutateConvex('orders:updateOrderWithShiprocket', {
      orderId: order._id,
      shiprocketDetails: updateData.shiprocketDetails,
      estimatedDeliveryDate: updateData.estimatedDeliveryDate,
    });

    return NextResponse.json({
      success: true,
      message: 'Shiprocket order created successfully',
      shiprocketOrderId: result.data?.order_id || result.order_id,
      shipmentId: result.data?.shipment_id || result.shipment_id,
      awbCode: result.data?.awb_code || result.awb_code,
      courierName: result.data?.courier_name || result.courier_name,
      estimatedDeliveryDate: actualDeliveryEstimate,
      debug: {
        hasOrderId: !!(result.data?.order_id || result.order_id),
        hasShipmentId: !!(result.data?.shipment_id || result.shipment_id),
        resultKeys: Object.keys(result),
        dataKeys: result.data ? Object.keys(result.data) : [],
        message: result.message,
        deliveryEstimateUpdated: !!actualDeliveryEstimate,
      }
    });

  } catch (error) {
    console.error('Error in auto-shiprocket API:', error);
    
    // Try to update order with error details (only if we have orderNumber)
    if (orderNumber) {
      try {
        const order = await queryConvex('orders:getOrderByNumber', { orderNumber });
        if (order) {
          await mutateConvex('orders:updateOrderWithShiprocket', {
            orderId: order._id,
            shiprocketDetails: {
              status: 'failed',
              error: error.message,
            },
          });
        }
      } catch (updateError) {
        console.error('Failed to update order with error details:', updateError);
      }
    }
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create Shiprocket order',
    }, { status: 500 });
  }
}