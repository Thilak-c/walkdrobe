// Get pickup locations from Shiprocket
import fetch from 'node-fetch';

const EMAIL = 'team@walkdrobe.in';
const PASSWORD = 'OtK2gLTjr2T$N1oT5&w@@hOHn$R$3L&4';

async function getPickupLocations() {
  try {
    console.log('🔐 Authenticating with Shiprocket...');
    
    // Authenticate
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
      console.log('Response:', JSON.stringify(authData, null, 2));
      return;
    }
    
    console.log('✅ Authentication successful!\n');
    
    const token = authData.token;
    
    // Get pickup locations
    console.log('📍 Fetching pickup locations...\n');
    const pickupResponse = await fetch('https://apiv2.shiprocket.in/v1/external/settings/company/pickup', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    const pickupData = await pickupResponse.json();
    
    if (!pickupResponse.ok) {
      console.log('❌ Failed to fetch pickup locations');
      console.log('Response:', JSON.stringify(pickupData, null, 2));
      return;
    }
    
    console.log('✅ Pickup Locations Found:\n');
    
    if (pickupData.data && pickupData.data.shipping_address) {
      const locations = pickupData.data.shipping_address;
      
      console.log(`Found ${locations.length} pickup location(s):\n`);
      
      locations.forEach((location, index) => {
        console.log(`${index + 1}. Pickup Location: "${location.pickup_location}"`);
        console.log(`   Address: ${location.address}`);
        console.log(`   City: ${location.city}`);
        console.log(`   Pincode: ${location.pin_code}`);
        console.log(`   Phone: ${location.phone}`);
        console.log(`   Status: ${location.status === 2 ? 'Active' : 'Inactive'}`);
        console.log('');
      });
      
      console.log('📝 Use one of these exact names (case-sensitive) in your code:');
      locations.forEach((location, index) => {
        console.log(`   ${index + 1}. "${location.pickup_location}"`);
      });
      
    } else {
      console.log('No pickup locations found');
      console.log('Full response:', JSON.stringify(pickupData, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getPickupLocations();
