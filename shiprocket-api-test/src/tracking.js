import { apiRequest } from './api.js';

/**
 * Track shipment by AWB number
 */
export async function trackByAwb(awbCode) {
  return apiRequest('GET', `/courier/track/awb/${awbCode}`);
}

/**
 * Track shipment by Shiprocket Order ID
 */
export async function trackByOrderId(orderId) {
  return apiRequest('GET', `/courier/track?order_id=${orderId}`);
}

/**
 * Track shipment by Shipment ID
 */
export async function trackByShipmentId(shipmentId) {
  return apiRequest('GET', `/courier/track/shipment/${shipmentId}`);
}

/**
 * Get tracking through AWB (alternative endpoint)
 */
export async function getTrackingData(awbCode) {
  return apiRequest('GET', `/courier/track/awb/${awbCode}`);
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🔍 Testing Tracking API...\n');
  
  const testAwb = process.argv[2];
  
  if (!testAwb) {
    console.log('Usage: npm run tracking <AWB_NUMBER>');
    console.log('Example: npm run tracking 19041424751540');
    process.exit(1);
  }
  
  console.log(`Tracking AWB: ${testAwb}`);
  trackByAwb(testAwb)
    .then(data => console.log('Tracking Data:', JSON.stringify(data, null, 2)))
    .catch(err => console.error('Error:', err.message));
}
