import { apiRequest } from './api.js';

/**
 * Create a return order
 */
export async function createReturnOrder(returnData) {
  return apiRequest('POST', '/orders/create/return', returnData);
}

/**
 * Get all return orders
 */
export async function getReturnOrders(page = 1, perPage = 10) {
  return apiRequest('GET', `/orders/processing/return?page=${page}&per_page=${perPage}`);
}

// Sample return order data
export const sampleReturnOrder = {
  order_id: `RETURN-${Date.now()}`,
  order_date: new Date().toISOString().split('T')[0],
  pickup_customer_name: "Customer Name",
  pickup_last_name: "Last Name",
  pickup_address: "Customer Address",
  pickup_city: "Mumbai",
  pickup_state: "Maharashtra",
  pickup_country: "India",
  pickup_pincode: "400001",
  pickup_email: "customer@example.com",
  pickup_phone: "9876543210",
  shipping_customer_name: "Warehouse",
  shipping_last_name: "",
  shipping_address: "Warehouse Address",
  shipping_city: "Delhi",
  shipping_state: "Delhi",
  shipping_country: "India",
  shipping_pincode: "110001",
  shipping_email: "warehouse@example.com",
  shipping_phone: "9876543211",
  order_items: [
    {
      name: "Return Product",
      sku: "RET-SKU-001",
      units: 1,
      selling_price: 500,
      discount: 0,
      qc_enable: false
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
  console.log('↩️ Testing Returns API...\n');
  
  getReturnOrders()
    .then(data => console.log('Return Orders:', JSON.stringify(data, null, 2)))
    .catch(err => console.error('Error:', err.message));
}
