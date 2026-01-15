// Quick test for Shiprocket authentication
const EMAIL = 'imdyashodanand2006@gmail.com';
const PASSWORD = 'UFiPv8Mh*z$K9zU574CCt3Ep!WKwgz@n';

async function testAuth() {
  console.log('Testing Shiprocket authentication...');
  console.log('Email:', EMAIL);
  console.log('Password length:', PASSWORD.length);
  
  try {
    const response = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: EMAIL,
        password: PASSWORD
      })
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.token) {
      console.log('✅ Authentication successful!');
      console.log('Token:', data.token.substring(0, 50) + '...');
    } else {
      console.log('❌ Authentication failed!');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAuth();
