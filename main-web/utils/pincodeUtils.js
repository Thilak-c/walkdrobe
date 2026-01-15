/**
 * Utility functions for pincode validation and delivery checking
 */

/**
 * Validate if a pincode is in correct format
 * @param {string} pincode - The pincode to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export function isValidPincode(pincode) {
  return /^\d{6}$/.test(pincode);
}

/**
 * Check delivery availability for a pincode using Shiprocket API
 * @param {string} deliveryPincode - The delivery pincode to check
 * @param {string} pickupPincode - The pickup pincode (default: 400001)
 * @param {number} weight - Package weight in kg (default: 0.5)
 * @param {boolean} cod - Whether COD is required (default: true)
 * @returns {Promise<Object>} - Delivery availability data
 */
export async function checkPincodeDelivery(deliveryPincode, pickupPincode = '400001', weight = 0.5, cod = true) {
  if (!isValidPincode(deliveryPincode)) {
    throw new Error('Invalid pincode format. Please enter a 6-digit pincode.');
  }

  const params = new URLSearchParams({
    pincode: deliveryPincode,
    pickup_pincode: pickupPincode,
    weight: weight.toString(),
    cod: cod ? '1' : '0'
  });

  const response = await fetch(`/api/shiprocket/serviceability?${params}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to check delivery availability');
  }

  return data;
}

/**
 * Format delivery information for display
 * @param {Object} deliveryData - Raw delivery data from API
 * @returns {Object} - Formatted delivery information
 */
export function formatDeliveryInfo(deliveryData) {
  if (!deliveryData || !deliveryData.deliverable) {
    return {
      available: false,
      message: 'Delivery not available to this pincode'
    };
  }

  return {
    available: true,
    estimatedDays: deliveryData.estimatedDays || 'Not specified',
    codAvailable: deliveryData.codAvailable || false,
    courierCount: deliveryData.courierPartners?.length || 0,
    message: 'Delivery available to this pincode'
  };
}

/**
 * Get pickup pincode based on business location
 * You can modify this based on your business requirements
 * @returns {string} - Default pickup pincode
 */
export function getDefaultPickupPincode() {
  // You can make this dynamic based on inventory location, user location, etc.
  return process.env.NEXT_PUBLIC_DEFAULT_PICKUP_PINCODE || '400001';
}

/**
 * Common Indian metro city pincodes for testing
 */
export const METRO_PINCODES = {
  MUMBAI: ['400001', '400002', '400003', '400004', '400005'],
  DELHI: ['110001', '110002', '110003', '110004', '110005'],
  BANGALORE: ['560001', '560002', '560003', '560004', '560005'],
  CHENNAI: ['600001', '600002', '600003', '600004', '600005'],
  KOLKATA: ['700001', '700002', '700003', '700004', '700005'],
  HYDERABAD: ['500001', '500002', '500003', '500004', '500005'],
  PUNE: ['411001', '411002', '411003', '411004', '411005'],
  AHMEDABAD: ['380001', '380002', '380003', '380004', '380005']
};