#!/usr/bin/env node

console.log('🔍 Checking Shiprocket Orders\n');

const testOrderNumber = process.argv[2];

if (!testOrderNumber) {
  console.log('Usage: node check-shiprocket-orders.mjs ORDER_NUMBER');
  console.log('\nExample:');
  console.log('  node check-shiprocket-orders.mjs ORD1768505595520JSWE9');
  console.log('\nOr test the auto-shiprocket API:');
  console.log('  curl -X POST http://localhost:3000/api/auto-shiprocket \\');
  console.log('    -H "Content-Type: application/json" \\');
  console.log('    -d \'{"orderNumber": "YOUR_ORDER_NUMBER"}\'');
  process.exit(0);
}

console.log(`Testing order: ${testOrderNumber}\n`);

async function testOrder() {
  try {
    const response = await fetch(`http://localhost:3000/api/auto-shiprocket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderNumber: testOrderNumber
      })
    });

    const data = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n✅ Shiprocket order created successfully!');
      if (data.shiprocketOrderId) {
        console.log(`   Shiprocket Order ID: ${data.shiprocketOrderId}`);
      }
      if (data.shipmentId) {
        console.log(`   Shipment ID: ${data.shipmentId}`);
      }
      if (data.awbCode) {
        console.log(`   AWB Code: ${data.awbCode}`);
      }
      if (data.courierName) {
        console.log(`   Courier: ${data.courierName}`);
      }
    } else {
      console.log('\n❌ Failed to create Shiprocket order');
      console.log('   Error:', data.error || data.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testOrder();
