import { NextResponse } from 'next/server';
import shiprocketAPI from '@/lib/shiprocket-api';

export async function GET() {
  try {
    console.log('Testing Shiprocket order creation...');
    
    // Test order data
    const testOrderData = {
      orderNumber: `TEST_${Date.now()}`,
      orderDate: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0],
      pickupLocation: "warehouse",
      billingCustomerName: "Test",
      billingLastName: "Customer",
      billingAddress: "123 Test Street, Test Area",
      billingCity: "Patna",
      billingPincode: "800001",
      billingState: "Bihar",
      billingCountry: "India",
      billingEmail: "test@example.com",
      billingPhone: "918008439762",
      shippingIsBilling: true,
      shippingCustomerName: "Test",
      shippingLastName: "Customer",
      shippingAddress: "123 Test Street, Test Area",
      shippingCity: "Patna",
      shippingPincode: "800001",
      shippingState: "Bihar",
      shippingCountry: "India",
      shippingEmail: "test@example.com",
      shippingPhone: "918008439762",
      orderItems: [
        {
          name: "Test Product",
          sku: "TEST001",
          units: 1,
          selling_price: 100,
          discount: 0,
          tax: 0,
          hsn: 61091000
        }
      ],
      paymentMethod: "COD",
      subTotal: 100,
      length: 15,
      breadth: 10,
      height: 5,
      weight: 0.5
    };
    
    console.log('Creating test order with data:', JSON.stringify(testOrderData, null, 2));
    
    // Create order
    const result = await shiprocketAPI.createOrder(testOrderData);
    
    console.log('Shiprocket result:', JSON.stringify(result, null, 2));
    
    return NextResponse.json({
      success: true,
      message: 'Test order created successfully',
      result: result,
      hasOrderId: !!result.order_id,
      hasShipmentId: !!result.shipment_id,
      hasAwbCode: !!result.awb_code,
    });
    
  } catch (error) {
    console.error('Test order creation failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}