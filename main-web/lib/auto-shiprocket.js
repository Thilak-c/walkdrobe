// Auto Shiprocket order creation utility
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import shiprocketAPI, { formatOrderForShiprocket } from './shiprocket-api';

// Create Convex client for server-side usage
const convex = new ConvexHttpClient(process.env.CONVEX_SELF_HOSTED_URL);
convex.setAuth(process.env.CONVEX_SELF_HOSTED_ADMIN_KEY);

export async function createShiprocketOrderForPayment(orderNumber) {
  try {
    // Get order details from database
    const order = await convex.query(api.orders.getOrderByNumber, { orderNumber });
    
    if (!order) {
      throw new Error(`Order not found: ${orderNumber}`);
    }

    // Skip if Shiprocket order already exists
    if (order.shiprocketDetails?.shiprocketOrderId) {
      return {
        success: true,
        message: 'Shiprocket order already exists',
        shiprocketOrderId: order.shiprocketDetails.shiprocketOrderId,
      };
    }

    // Create Shiprocket order directly via API
    const shiprocketOrderData = formatOrderForShiprocket(order);
    const result = await shiprocketAPI.createOrder(shiprocketOrderData);

    // Update order in database with Shiprocket details
    await convex.mutation(api.orders.updateOrderWithShiprocket, {
      orderId: order._id,
      shiprocketDetails: {
        shiprocketOrderId: result.order_id,
        shipmentId: result.shipment_id,
        awbCode: result.awb_code,
        courierCompanyId: result.courier_company_id,
        courierName: result.courier_name,
        trackingUrl: result.awb_code ? `https://shiprocket.co/tracking/${result.awb_code}` : undefined,
        status: 'created',
      },
    });

    return {
      success: true,
      message: 'Shiprocket order created successfully',
      shiprocketOrderId: result.order_id,
      awbCode: result.awb_code,
      courierName: result.courier_name,
    };

  } catch (error) {
    console.error(`Error creating Shiprocket order for ${orderNumber}:`, error);

    // Try to update order with error details
    try {
      const order = await convex.query(api.orders.getOrderByNumber, { orderNumber });
      if (order) {
        await convex.mutation(api.orders.updateOrderWithShiprocket, {
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

    return {
      success: false,
      error: error.message,
      message: 'Failed to create Shiprocket order',
    };
  }
}

// Retry failed Shiprocket orders
export async function retryFailedShiprocketOrder(orderNumber) {
  try {
    const order = await convex.query(api.orders.getOrderByNumber, { orderNumber });
    
    if (!order) {
      throw new Error(`Order not found: ${orderNumber}`);
    }

    // Reset Shiprocket details before retry
    await convex.mutation(api.orders.updateOrderWithShiprocket, {
      orderId: order._id,
      shiprocketDetails: {
        status: 'retrying',
        error: undefined,
      },
    });

    // Retry creation
    return await createShiprocketOrderForPayment(orderNumber);
  } catch (error) {
    console.error(`Error retrying Shiprocket order for ${orderNumber}:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}