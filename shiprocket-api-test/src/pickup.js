import { apiRequest } from './api.js';

/**
 * Get all pickup locations
 */
export async function getPickupLocations() {
  return apiRequest('GET', '/settings/company/pickup');
}

/**
 * Add a new pickup location
 */
export async function addPickupLocation(locationData) {
  return apiRequest('POST', '/settings/company/addpickup', locationData);
}

// Sample pickup location data
export const samplePickupLocation = {
  pickup_location: "Warehouse 1",
  name: "John Doe",
  email: "warehouse@example.com",
  phone: "9876543210",
  address: "456 Warehouse Street",
  address_2: "",
  city: "Mumbai",
  state: "Maharashtra",
  country: "India",
  pin_code: "400001"
};

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('📍 Testing Pickup Locations API...\n');
  
  getPickupLocations()
    .then(data => console.log('Pickup Locations:', JSON.stringify(data, null, 2)))
    .catch(err => console.error('Error:', err.message));
}
