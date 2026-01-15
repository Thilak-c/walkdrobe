// Direct test of Shiprocket API
import fetch from 'node-fetch';

const EMAIL = 'team@walkdrobe.in';
const PASSWORD = 'OtK2gLTjr2T$N1oT5&w@@hOHn$R$3L&4';

async function testShiprocketDirect() {
  console.log('🔐 Authenticating with Shiprocket...');
  
  // Step 1: Authenticate
  const authResponse = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: EMAIL,
      password: PASSWORD
    })
  });
  
  const authData = await authResponse.json();
  
  if (!authResponse.ok || !authData.token) {
    console.log('❌ Authentication failed:', authData);
    return;
  }
  
  console.log('✅ Authentication successful');
  const token = authData.token;
  
  // Step 2: Create a test order
  console.log('\n📦 Creating test order...');
  
  const testOrder = {
    order_id: `TEST_${Date.now()}`,
    order_date: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0],
    pickup_location: "warehouse",
    billing_customer_name: "Test",
    billing_last_name: "Customer",
    billing_address: "123 Test Street, Test Area",
    billing_city: "Patna",
    billing_pincode: "800001",
    billing_state: "Bihar",
    billing_country: "India",
    billing_email: "test@example.com",
    billing_phone: "919999999999",
    shipping_is_billing: true,
    shipping_customer_name: "Test",
    shipping_last_name: "Customer", 
    shipping_address: "123 Test Street, Test Area",
    shipping_city: "Patna",
    shipping_pincode: "800001",
    shipping_state: "Bihar",
    shipping_country: "India",
    shipping_email: "test@example.com",
    shipping_phone: "919999999999",
    order_items: [
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
    payment_method: "COD",
    sub_total: 100,
    length: 15,
    breadth: 10,
    height: 5,
    weight: 0.5
  };
  
  console.log('Order data:', JSON.stringify(testOrder, null, 2));
  
  const orderResponse = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(testOrder)
  });
  
  const orderData = await orderResponse.json();
  
  console.log('\n📋 Shiprocket Response:');
  console.log('Status:', orderResponse.status);
  console.log('Response:', JSON.stringify(orderData, null, 2));
  
  if (orderResponse.ok) {
    console.log('\n✅ Order created successfully!');
    if (orderData.order_id) {
      console.log('Shiprocket Order ID:', orderData.order_id);
    }
    if (orderData.shipment_id) {
      console.log('Shipment ID:', orderData.shipment_id);
    }
    if (orderData.awb_code) {
      console.log('AWB Code:', orderData.awb_code);
    }
  } else {
    console.log('\n❌ Order creation failed!');
  }
}

testShiprocketDirect().catch(console.error);