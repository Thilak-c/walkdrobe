import { NextResponse } from 'next/server';
import shiprocketAPI from '@/lib/shiprocket-api';

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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('orderNumber');
    const shipmentId = searchParams.get('shipmentId');

    if (!orderNumber && !shipmentId) {
      return NextResponse.json(
        { error: 'Order number or shipment ID is required' },
        { status: 400 }
      );
    }

    let order;
    let trackingShipmentId = shipmentId;

    // If order number provided, get order details first
    if (orderNumber) {
      order = await queryConvex('orders:getOrderByNumber', { orderNumber });
      
      if (!order) {
        return NextResponse.json(
          { error: `Order not found: ${orderNumber}` },
          { status: 404 }
        );
      }

      // Get shipment ID from order
      trackingShipmentId = order.shiprocketDetails?.shipmentId;
      
      if (!trackingShipmentId) {
        return NextResponse.json({
          success: false,
          error: 'No Shiprocket shipment found for this order',
          order: {
            orderNumber: order.orderNumber,
            status: order.status,
            hasShiprocket: false,
          }
        });
      }
    }

    // Track shipment in Shiprocket
    const trackingData = await shiprocketAPI.trackOrder(trackingShipmentId);

    // Parse tracking data
    const tracking = trackingData.tracking_data || {};
    const shipmentTrack = tracking.shipment_track?.[0] || {};
    const shipmentTrackActivities = shipmentTrack.shipment_track_activities || [];

    // Format tracking activities
    const activities = shipmentTrackActivities.map(activity => ({
      date: activity.date,
      status: activity.activity,
      location: activity.location || '',
      srStatus: activity['sr-status'] || activity.sr_status || '',
      srStatusLabel: activity['sr-status-label'] || activity.sr_status_label || '',
    }));

    // Get current status
    const currentStatus = shipmentTrack.current_status || order?.status || 'unknown';
    const deliveredDate = shipmentTrack.delivered_date;
    const expectedDeliveryDate = shipmentTrack.edd;
    const awbCode = shipmentTrack.awb_code || order?.shiprocketDetails?.awbCode;
    const courierName = shipmentTrack.courier_name || order?.shiprocketDetails?.courierName;

    // Update order in database with latest tracking info
    if (order) {
      try {
        await mutateConvex('orders:updateOrderWithShiprocket', {
          orderId: order._id,
          shiprocketDetails: {
            ...order.shiprocketDetails,
            awbCode: awbCode || order.shiprocketDetails?.awbCode,
            courierName: courierName || order.shiprocketDetails?.courierName,
            currentStatus: currentStatus,
            lastTracked: Date.now(),
          },
          estimatedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate).getTime() : order.estimatedDeliveryDate,
        });
      } catch (updateError) {
        console.error('Failed to update order with tracking data:', updateError);
      }
    }

    return NextResponse.json({
      success: true,
      tracking: {
        shipmentId: trackingShipmentId,
        awbCode,
        courierName,
        currentStatus,
        deliveredDate,
        expectedDeliveryDate,
        activities,
        trackingUrl: awbCode ? `https://shiprocket.co/tracking/${awbCode}` : null,
      },
      order: order ? {
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt,
        orderTotal: order.orderTotal,
      } : null,
    });

  } catch (error) {
    console.error('Error tracking shipment:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to track shipment',
    }, { status: 500 });
  }
}
