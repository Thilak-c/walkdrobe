// Test Shiprocket authentication and list orders
import fetch from 'node-fetch';

const EMAIL = 'team@walkdrobe.in';
const PASSWORD = 'OtK2gLTjr2T$N1oT5&w@@hOHn$R$3L&4';

async function testShiprocket() {
  try {
    console.log('🔐 Testing Shiprocket Authentication...');
    console.log('Email:', EMAIL);
    
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
      console.log('❌ Authentication failed!');
      console.log('Status:', authResponse.status);
      console.log('Response:', JSON.stringify(authData, null, 2));
      return;
    }
    
    console.log('✅ Authentication successful!');
    console.log('Token length:', authData.token.length);
    
    const token = authData.token;
    
    // Step 2: Get pickup locations
    console.log('\n📍 Fetching pickup locations...');
    const pickupResponse = await fetch('https://apiv2.shiprocket.in/v1/external/settings/company/pickup', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    const pickupData = await pickupResponse.json();
    console.log('Pickup locations:', JSON.stringify(pickupData, null, 2));
    
    // Step 3: List recent orders
    console.log('\n📦 Fetching recent orders...');
    const ordersResponse = await fetch('https://apiv2.shiprocket.in/v1/external/orders', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    const ordersData = await ordersResponse.json();
    console.log('Orders response:', JSON.stringify(ordersData, null, 2));
    
    if (ordersData.data && ordersData.data.length > 0) {
      console.log(`\n✅ Found ${ordersData.data.length} orders`);
      ordersData.data.slice(0, 3).forEach(order => {
        console.log(`\nOrder: ${order.channel_order_id}`);
        console.log(`  Status: ${order.status}`);
        console.log(`  Created: ${order.created_at}`);
      });
    } else {
      console.log('\n⚠️  No orders found in Shiprocket dashboard');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

testShiprocket();
