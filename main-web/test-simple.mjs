console.log('Testing basic functionality...');

// Test environment variables
console.log('SHIPROCKET_EMAIL:', process.env.SHIPROCKET_EMAIL || 'Not set');
console.log('SHIPROCKET_PASSWORD:', process.env.SHIPROCKET_PASSWORD ? 'Set (length: ' + process.env.SHIPROCKET_PASSWORD.length + ')' : 'Not set');
console.log('SHIPROCKET_PICKUP_PINCODE:', process.env.SHIPROCKET_PICKUP_PINCODE || 'Not set');

// Test basic fetch
console.log('\nTesting basic fetch...');
try {
  const response = await fetch('https://httpbin.org/json');
  const data = await response.json();
  console.log('✅ Fetch working, got response with slideshow:', !!data.slideshow);
} catch (error) {
  console.log('❌ Fetch error:', error.message);
}

console.log('\nTest completed!');