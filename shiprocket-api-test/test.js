import axios from 'axios';

const EMAIL = 't800843976@gmail.com';
const PASSWORD = 'd33YXEEhKLjU#u2#JokgM6pPdRD8$KVr';
const BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

console.log('🚀 Testing Shiprocket API...');
console.log('Email:', EMAIL);
console.log('Password:', PASSWORD);

async function test() {
  try {
    console.log('\n🔐 Authenticating...');
    const authResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: EMAIL,
      password: PASSWORD
    });
    
    const token = authResponse.data.token;
    console.log('✅ Token received:', token.substring(0, 30) + '...');
    
    console.log('\n📍 Fetching pickup locations...');
    const pickupResponse = await axios.get(`${BASE_URL}/settings/company/pickup`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Pickup Locations:', JSON.stringify(pickupResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.status, error.response?.data || error.message);
  }
}

test();
