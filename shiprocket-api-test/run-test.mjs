import https from 'https';
import fs from 'fs';

const EMAIL = 'team@walkdrobe.in';
const PASSWORD = 'OtK2gLTjr2T$N1oT5&w@@hOHn$R$3L&4';
const BASE_URL = 'apiv2.shiprocket.in';

let output = '';
function log(msg) {
  output += msg + '\n';
  fs.writeFileSync('test-output.txt', output);
}

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
  log('🚀 Testing Shiprocket API');
  log('Email: ' + EMAIL);
  
  try {
    log('\n1️⃣ Authenticating...');
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
    
    log('Auth Status: ' + authResult.status);
    
    if (authResult.status !== 200 || !authResult.data.token) {
      log('❌ Auth failed: ' + JSON.stringify(authResult.data));
      return;
    }
    
    const token = authResult.data.token;
    log('✅ Token: ' + token.substring(0, 30) + '...');
    
    log('\n2️⃣ Fetching Pickup Locations...');
    const pickupResult = await makeRequest({
      hostname: BASE_URL,
      path: '/v1/external/settings/company/pickup',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    });
    
    log('Pickup Status: ' + pickupResult.status);
    if (pickupResult.data?.data?.shipping_address) {
      log('✅ Pickup Locations: ' + pickupResult.data.data.shipping_address.length);
      pickupResult.data.data.shipping_address.forEach((loc, i) => {
        log('   ' + (i+1) + '. ' + loc.pickup_location + ' - ' + loc.city + ', ' + loc.pin_code);
      });
    } else {
      log('Response: ' + JSON.stringify(pickupResult.data, null, 2));
    }
    
    log('\n3️⃣ Checking Serviceability (400001 → 110001)...');
    const serviceResult = await makeRequest({
      hostname: BASE_URL,
      path: '/v1/external/courier/serviceability/?pickup_postcode=400001&delivery_postcode=110001&weight=0.5&cod=0',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    });
    
    log('Serviceability Status: ' + serviceResult.status);
    if (serviceResult.data?.data?.available_courier_companies) {
      const couriers = serviceResult.data.data.available_courier_companies;
      log('✅ Available Couriers: ' + couriers.length);
      couriers.slice(0, 5).forEach((c, i) => {
        log('   ' + (i+1) + '. ' + c.courier_name + ' - ₹' + c.rate + ' (' + c.etd + ')');
      });
    } else {
      log('Response: ' + JSON.stringify(serviceResult.data, null, 2));
    }
    
    // 4. Check Pincode Serviceability
    log('\n4️⃣ Checking Pincode Availability (110001)...');
    const pincodeResult = await makeRequest({
      hostname: BASE_URL,
      path: '/v1/external/open/postcode/details?postcode=110001',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    });
    
    log('Pincode Status: ' + pincodeResult.status);
    log('Response: ' + JSON.stringify(pincodeResult.data, null, 2));
    
    // 5. Check multiple pincodes
    const testPincodes = ['110001', '400001', '560001', '700001', '999999'];
    log('\n5️⃣ Testing Multiple Pincodes...');
    
    for (const pin of testPincodes) {
      const result = await makeRequest({
        hostname: BASE_URL,
        path: '/v1/external/open/postcode/details?postcode=' + pin,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        }
      });
      
      if (result.data?.success || result.data?.postcode_details) {
        const details = result.data.postcode_details;
        log('   ✅ ' + pin + ' - ' + (details?.city || 'Available') + ', ' + (details?.state || ''));
      } else {
        log('   ❌ ' + pin + ' - Not serviceable or invalid');
      }
    }
    
    log('\n✅ All tests completed!');
    
  } catch (error) {
    log('❌ Error: ' + error.message);
  }
}

testShiprocket();
