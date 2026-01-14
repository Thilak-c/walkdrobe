/**
 * Shiprocket API Test Suite
 * 
 * This is the main entry point for testing Shiprocket APIs.
 * Run individual modules using npm scripts or import them as needed.
 */

import { getAuthToken } from './src/auth.js';
import { getOrders, createOrder, sampleOrder } from './src/orders.js';
import { checkServiceability } from './src/shipping.js';
import { trackByAwb } from './src/tracking.js';
import { getPickupLocations } from './src/pickup.js';

async function runTests() {
  console.log('🚀 Shiprocket API Test Suite\n');
  console.log('='.repeat(50));
  
  try {
    // 1. Authentication
    console.log('\n1️⃣ Testing Authentication...');
    const token = await getAuthToken();
    console.log('Token received:', token.substring(0, 20) + '...');
    
    // 2. Get Pickup Locations
    console.log('\n2️⃣ Fetching Pickup Locations...');
    const locations = await getPickupLocations();
    console.log('Pickup locations found:', locations.data?.shipping_address?.length || 0);
    
    // 3. Check Serviceability
    console.log('\n3️⃣ Checking Serviceability (Mumbai → Delhi)...');
    const rates = await checkServiceability({
      pickupPincode: '400001',
      deliveryPincode: '110001',
      weight: 0.5,
      cod: false
    });
    console.log('Available couriers:', rates.data?.available_courier_companies?.length || 0);
    
    // 4. Get Orders
    console.log('\n4️⃣ Fetching Recent Orders...');
    const orders = await getOrders(1, 5);
    console.log('Orders found:', orders.data?.length || 0);
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests };
