import fetch from 'node-fetch';

async function testPickupFix() {
  console.log('🔧 Testing Pickup Location Fix...\n');
  
  try {
    // Test the direct order creation
    console.log('Testing direct order creation...');
    const response = await fetch('http://localhost:3000/api/test-shiprocket-order');
    const result = await response.json();
    
    console.log('Status:', response.status);
    console.log('Success:', result.success);
    
    if (result.success) {
      console.log('✅ Order created successfully!');
      console.log('Has Order ID:', result.hasOrderId);
      console.log('Has Shipment ID:', result.hasShipmentId);
      console.log('Has AWB Code:', result.hasAwbCode);
    } else {
      console.log('❌ Order creation failed:');
      console.log('Error:', result.error);
    }
    
    // Test existing order
    console.log('\nTesting existing order...');
    const orderResponse = await fetch('http://localhost:3000/api/auto-shiprocket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderNumber: 'ORD176850879717914A3X' })
    });
    
    const orderResult = await orderResponse.json();
    console.log('Order test success:', orderResult.success);
    
    if (orderResult.debug) {
      console.log('Has Order ID:', orderResult.debug.hasOrderId);
      console.log('Result keys:', orderResult.debug.resultKeys);
      if (orderResult.debug.dataKeys) {
        console.log('Data keys:', orderResult.debug.dataKeys);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testPickupFix();