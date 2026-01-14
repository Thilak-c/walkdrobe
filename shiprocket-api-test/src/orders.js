import { apiRequest } from './api.js';

/**
 * Create a new order
 */
export async function createOrder(orderData) {
  return apiRequest('POST', '/orders/create/adhoc', orderData);
}

/**
 * Get all orders
 */
export async function getOrders(page = 1, perPage = 10) {
  return apiRequest('GET', `/orders?page=${page}&per_page=${perPage}`);
}

/**
 * Get specific order details
 */
export async function getOrderDetails(orderId) {
  return apiRequest('GET', `/orders/show/${orderId}`);
}

/**
 * Cancel an order
 */
export async function cancelOrder(orderIds) {
  return apiRequest('POST', '/orders/cancel', { ids: orderIds });
}

/**
 * Update pickup location for an order
 */
export async function updatePickupLocation(orderId, pickupLocationId) {
  return apiRequest('PATCH', '/orders/address/pickup', {
    order_id: orderId,
    pickup_location_id: pickupLocationId
  });
}

// Sample order data for testing
export const sampleOrder = {
  order_id: `TEST-${Date.now()}`,
  order_date: new Date().toISOString().split('T')[0],
  pickup_location: "Primary",
  billing_customer_name: "Test Customer",
  billing_last_name: "User",
  billing_address: "123 Test Street",
  billing_city: "Mumbai",
  billing_pincode: "400001",
  billing_state: "Maharashtra",
  billing_country: "India",
  billing_email: "test@example.com",
  billing_phone: "9876543210",
  shipping_is_billing: true,
  order_items: [
    {
      name: "Test Product",
      sku: "TEST-SKU-001",
      units: 1,
      selling_price: 500,
      discount: 0,
      tax: 0
    }
  ],
  payment_method: "Prepaid",
  sub_total: 500,
  length: 10,
  breadth: 10,
  height: 5,
  weight: 0.5
};

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('📦 Testing Orders API...\n');
  
  // Test: Get orders list
  console.log('1. Fetching orders list...');
  getOrders()
    .then(data => console.log('Orders:', JSON.stringify(data, null, 2)))
    .catch(err => console.error('Error:', err.message));
}
