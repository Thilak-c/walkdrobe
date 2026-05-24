// Shiprocket API utility functions
import crypto from 'crypto';

class ShiprocketAPI {
  constructor() {
    this.baseURL = 'https://apiv2.shiprocket.in/v1/external';
    this.token = null;
    this.tokenExpiry = null;
  }

  // Authenticate and get token
  async authenticate() {
    try {
      // Check if token is still valid (with 5 minute buffer)
      if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry - 300000) {
        return this.token;
      }

      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: process.env.SHIPROCKET_EMAIL,
          password: process.env.SHIPROCKET_PASSWORD,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      this.token = data.token;
      // Token typically expires in 10 days, but we'll refresh more frequently
      this.tokenExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      
      return this.token;
    } catch (error) {
      console.error('Shiprocket authentication error:', error);
      throw error;
    }
  }

  // Make authenticated API request
  async makeRequest(endpoint, method = 'GET', data = null) {
    try {
      const token = await this.authenticate();
      
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, options);
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `API request failed: ${response.status}`);
      }

      return responseData;
    } catch (error) {
      console.error(`Shiprocket API error (${endpoint}):`, error);
      throw error;
    }
  }

  // Create order in Shiprocket
  async createOrder(orderData) {
    try {
      const {
        orderNumber,
        orderDate,
        pickupLocation,
        billingCustomerName,
        billingLastName,
        billingAddress,
        billingCity,
        billingPincode,
        billingState,
        billingCountry,
        billingEmail,
        billingPhone,
        shippingIsBilling,
        shippingCustomerName,
        shippingLastName,
        shippingAddress,
        shippingCity,
        shippingPincode,
        shippingState,
        shippingCountry,
        shippingEmail,
        shippingPhone,
        orderItems,
        paymentMethod,
        subTotal,
        length,
        breadth,
        height,
        weight,
      } = orderData;

      const shiprocketOrderData = {
        order_id: orderNumber,
        order_date: orderDate,
        pickup_location: pickupLocation || "Primary",
        billing_customer_name: billingCustomerName,
        billing_last_name: billingLastName || "",
        billing_address: billingAddress,
        billing_city: billingCity,
        billing_pincode: billingPincode,
        billing_state: billingState,
        billing_country: billingCountry,
        billing_email: billingEmail,
        billing_phone: billingPhone,
        shipping_is_billing: shippingIsBilling,
        shipping_customer_name: shippingCustomerName,
        shipping_last_name: shippingLastName || "",
        shipping_address: shippingAddress,
        shipping_city: shippingCity,
        shipping_pincode: shippingPincode,
        shipping_state: shippingState,
        shipping_country: shippingCountry,
        shipping_email: shippingEmail,
        shipping_phone: shippingPhone,
        order_items: orderItems,
        payment_method: paymentMethod,
        sub_total: subTotal,
        length: length || 10,
        breadth: breadth || 10,
        height: height || 5,
        weight: weight || 0.5,
      };

      const response = await this.makeRequest('/orders/create/adhoc', 'POST', shiprocketOrderData);
      return response;
    } catch (error) {
      console.error('Error creating Shiprocket order:', error);
      throw error;
    }
  }

  // Check serviceability
  async checkServiceability(pickupPincode, deliveryPincode, weight = 0.5) {
    try {
      const response = await this.makeRequest(
        `/courier/serviceability/?pickup_postcode=${pickupPincode}&delivery_postcode=${deliveryPincode}&weight=${weight}&cod=1`
      );
      return response;
    } catch (error) {
      console.error('Error checking serviceability:', error);
      throw error;
    }
  }

  // Track order
  async trackOrder(shipmentId) {
    try {
      const response = await this.makeRequest(`/courier/track/shipment/${shipmentId}`);
      return response;
    } catch (error) {
      console.error('Error tracking order:', error);
      throw error;
    }
  }

  // Get order details
  async getOrderDetails(orderId) {
    try {
      const response = await this.makeRequest(`/orders/show/${orderId}`);
      return response;
    } catch (error) {
      console.error('Error getting order details:', error);
      throw error;
    }
  }
}

// Helper function to format phone number for Shiprocket
function formatPhoneNumber(phone) {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // If it's a 10-digit Indian number, add country code
  if (cleanPhone.length === 10 && cleanPhone.match(/^[6-9]/)) {
    return `91${cleanPhone}`;
  }
  
  // If it already has country code (11-12 digits), use as is
  if (cleanPhone.length >= 11 && cleanPhone.length <= 12) {
    return cleanPhone;
  }
  
  // If it's less than 10 digits, pad with zeros (fallback)
  if (cleanPhone.length < 10) {
    return `91${cleanPhone.padStart(10, '0')}`;
  }
  
  // Default fallback - return first 12 digits
  return cleanPhone.substring(0, 12);
}

// Helper function to format order data for Shiprocket
export function formatOrderForShiprocket(order, config = null) {
  const shippingDetails = order.shippingDetails;
  const items = order.items;
  
  // Split full name into first and last name
  const nameParts = shippingDetails.fullName.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Format phone numbers for Shiprocket
  const formattedPhone = formatPhoneNumber(shippingDetails.phone);

  // Format order items for Shiprocket
  const orderItems = items.map(item => ({
    name: item.name,
    sku: item.productId,
    units: item.quantity,
    selling_price: item.price,
    discount: 0,
    tax: 0,
    hsn: 61091000, // HSN code for clothing
  }));

  // Resolve config settings
  const targetLength = config?.length || 15;
  const targetBreadth = config?.breadth || 10;
  const targetHeight = config?.height || 5;
  const targetWeightVal = config?.weight || 0.5;

  // Calculate total weight (estimate configured per-item weight)
  const totalWeight = items.reduce((total, item) => total + (item.quantity * targetWeightVal), 0);

  // Format address
  const fullAddress = `${shippingDetails.flatNo || ''}, ${shippingDetails.area || ''}, ${shippingDetails.address}`.replace(/^,\s*/, '').replace(/,\s*,/g, ',');

  return {
    orderNumber: order.orderNumber,
    orderDate: new Date(order.createdAt).toISOString().split('T')[0] + ' ' + new Date(order.createdAt).toTimeString().split(' ')[0],
    pickupLocation: "warehouse",
    billingCustomerName: firstName,
    billingLastName: lastName,
    billingAddress: fullAddress,
    billingCity: shippingDetails.city,
    billingPincode: shippingDetails.pincode,
    billingState: shippingDetails.state,
    billingCountry: shippingDetails.country || "India",
    billingEmail: shippingDetails.email,
    billingPhone: formattedPhone,
    shippingIsBilling: true,
    shippingCustomerName: firstName,
    shippingLastName: lastName,
    shippingAddress: fullAddress,
    shippingCity: shippingDetails.city,
    shippingPincode: shippingDetails.pincode,
    shippingState: shippingDetails.state,
    shippingCountry: shippingDetails.country || "India",
    shippingEmail: shippingDetails.email,
    shippingPhone: formattedPhone,
    orderItems: orderItems,
    paymentMethod: order.paymentDetails.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
    subTotal: order.paymentDetails.paymentMethod === 'cod'
      ? (order.paymentDetails.remainingCOD || (order.orderTotal - (order.paymentDetails.codCharge || 100)))
      : order.orderTotal,
    length: targetLength,
    breadth: targetBreadth,
    height: targetHeight,
    weight: Math.max(totalWeight, targetWeightVal),
  };
}

// Create singleton instance
const shiprocketAPI = new ShiprocketAPI();

export default shiprocketAPI;