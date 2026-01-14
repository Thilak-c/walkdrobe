import { apiRequest } from './api.js';

/**
 * Check serviceability and get shipping rates
 */
export async function checkServiceability(params) {
  const query = new URLSearchParams({
    pickup_postcode: params.pickupPincode,
    delivery_postcode: params.deliveryPincode,
    weight: params.weight,
    cod: params.cod ? 1 : 0
  }).toString();
  
  return apiRequest('GET', `/courier/serviceability?${query}`);
}

/**
 * Get available couriers for a shipment
 */
export async function getAvailableCouriers(shipmentId) {
  return apiRequest('GET', `/courier/courierListWithCounts?shipment_id=${shipmentId}`);
}

/**
 * Assign AWB to shipment
 */
export async function assignAwb(shipmentId, courierId) {
  return apiRequest('POST', '/courier/assign/awb', {
    shipment_id: shipmentId,
    courier_id: courierId
  });
}

/**
 * Generate pickup request
 */
export async function requestPickup(shipmentId) {
  return apiRequest('POST', '/courier/generate/pickup', {
    shipment_id: [shipmentId]
  });
}

/**
 * Generate shipping label
 */
export async function generateLabel(shipmentIds) {
  return apiRequest('POST', '/courier/generate/label', {
    shipment_id: shipmentIds
  });
}

/**
 * Generate invoice
 */
export async function generateInvoice(orderIds) {
  return apiRequest('POST', '/orders/print/invoice', {
    ids: orderIds
  });
}

/**
 * Generate manifest
 */
export async function generateManifest(shipmentIds) {
  return apiRequest('POST', '/manifests/generate', {
    shipment_id: shipmentIds
  });
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚚 Testing Shipping API...\n');
  
  // Test: Check serviceability
  console.log('Checking serviceability between Mumbai (400001) and Delhi (110001)...');
  checkServiceability({
    pickupPincode: '400001',
    deliveryPincode: '110001',
    weight: 0.5,
    cod: false
  })
    .then(data => console.log('Shipping Rates:', JSON.stringify(data, null, 2)))
    .catch(err => console.error('Error:', err.message));
}
