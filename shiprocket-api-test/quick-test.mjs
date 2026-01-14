import https from 'https';

const EMAIL = 'team@walkdrobe.in';
const PASSWORD = 'OtK2gLTjr2T$N1oT5&w@@hOHn$R$3L&4';
const BASE_URL = 'apiv2.shiprocket.in';

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    if (postData) req.write(postData);
    req.end();
  });
}

async function testShiprocket() {
  console.log('🚀 Testing Shiprocket API\n');
  console.log('Email:', EMAIL);
  
  try {
    // 1. Authentication
    console.log('\n1️⃣ Authenticating...');
    const authBody = JSON.stringify({ email: EMAIL, password: PASSWORD });
    const authResult = await makeRequest({
      hostname: BASE_URL,
      path: '/v1/external/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(authBody)
      }
    }, authBody);
    
    console.log('Auth Status:', authResult.status);
    
    if (authResult.status !== 200 || !authResult.data.token) {
      console.log('❌ Auth failed:', authResult.data);
      return;
    }
    
    const token = authResult.data.token;
    console.log('✅ Token:', token.substring(0, 30) + '...');
    
    // 2. Get Pickup Locations
    console.log('\n2️⃣ Fetching Pickup Locations...');
    const pickupResult = await makeRequest({
      hostname: BASE_URL,
      path: '/v1/external/settings/company/pickup',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Pickup Status:', pickupResult.status);
    if (pickupResult.data?.data?.shipping_address) {
      console.log('✅ Pickup Locations:', pickupResult.data.data.shipping_address.length);
      pickupResult.data.data.shipping_address.forEach((loc, i) => {
        console.log(`   ${i+1}. ${loc.pickup_location} - ${loc.city}, ${loc.pin_code}`);
      });
    } else {
      console.log('Response:', JSON.stringify(pickupResult.data, null, 2));
    }
    
    // 3. Check Serviceability
    console.log('\n3️⃣ Checking Serviceability (400001 → 110001)...');
    const serviceResult = await makeRequest({
      hostname: BASE_URL,
      path: '/v1/external/courier/serviceability/?pickup_postcode=400001&delivery_postcode=110001&weight=0.5&cod=0',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Serviceability Status:', serviceResult.status);
    if (serviceResult.data?.data?.available_courier_companies) {
      const couriers = serviceResult.data.data.available_courier_companies;
      console.log('✅ Available Couriers:', couriers.length);
      couriers.slice(0, 5).forEach((c, i) => {
        console.log(`   ${i+1}. ${c.courier_name} - ₹${c.rate} (${c.etd})`);
      });
    } else {
      console.log('Response:', JSON.stringify(serviceResult.data, null, 2));
    }
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testShiprocket();
