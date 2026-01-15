import fetch from 'node-fetch';

async function quickTest() {
  try {
    console.log('Testing order creation...');
    
    const response = await fetch('http://localhost:3000/api/auto-shiprocket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderNumber: 'ORD176850879717914A3X' })
    });
    
    const result = await response.json();
    console.log('Result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

quickTest();