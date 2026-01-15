# Shiprocket Integration Guide

This document explains the automatic Shiprocket order creation system implemented in the Walk Drobe e-commerce platform.

## Overview

The system automatically creates Shiprocket orders when payments are successful, enabling seamless order fulfillment and tracking.

## Features

- ✅ Automatic Shiprocket order creation on payment success
- ✅ Support for all payment methods (Online, COD, Hybrid)
- ✅ Shiprocket order details stored in database
- ✅ Admin interface for monitoring and managing orders
- ✅ Retry mechanism for failed order creation
- ✅ AWB code generation and tracking URLs
- ✅ Error handling and logging

## Configuration

### Environment Variables

The following environment variables are required in `.env.local`:

```env
# Shiprocket API Credentials
SHIPROCKET_EMAIL=your-shiprocket-email@example.com
SHIPROCKET_PASSWORD=your-shiprocket-password
SHIPROCKET_PICKUP_PINCODE=your-pickup-pincode
```

### Database Schema

The orders table has been extended with `shiprocketDetails` field:

```javascript
shiprocketDetails: {
  shiprocketOrderId: number,
  shipmentId: number,
  awbCode: string,
  courierCompanyId: number,
  courierName: string,
  trackingUrl: string,
  createdAt: number,
  status: string,
  error: string
}
```

## How It Works

### 1. Payment Success Flow

When a payment is successful (online or COD), the system:

1. Creates the order in the database
2. Sends confirmation emails
3. **Automatically calls `/api/auto-shiprocket`** to create Shiprocket order
4. Updates the order with Shiprocket details
5. Redirects to success page

### 2. Shiprocket Order Creation

The system formats order data according to Shiprocket API requirements:

- **Customer Details**: Name, email, phone, address
- **Order Items**: Product details, quantities, prices
- **Shipping Details**: Pickup and delivery addresses
- **Payment Method**: Prepaid or COD
- **Package Details**: Dimensions and weight (estimated)

### 3. Error Handling

If Shiprocket order creation fails:

- Error is logged and stored in database
- Order status remains valid (customer not affected)
- Admin can retry creation via admin interface
- System continues to function normally

## API Endpoints

### `/api/shiprocket/create-order` (POST)
Creates a Shiprocket order for a given order.

**Request:**
```json
{
  "order": {
    "orderNumber": "ORD123456",
    "items": [...],
    "shippingDetails": {...},
    "paymentDetails": {...}
  }
}
```

**Response:**
```json
{
  "success": true,
  "shiprocketOrderId": 12345,
  "awbCode": "SR123456789",
  "courierName": "Delhivery"
}
```

### `/api/auto-shiprocket` (POST)
Automatically creates Shiprocket order for an existing order.

**Request:**
```json
{
  "orderNumber": "ORD123456"
}
```

### `/api/test-shiprocket` (GET)
Tests Shiprocket authentication and API connectivity.

## Admin Interface

Access the Shiprocket admin interface at `/admin/shiprocket` to:

- View all orders with Shiprocket status
- Monitor success/failure rates
- Retry failed order creation
- View AWB codes and tracking links
- Get summary statistics

### Admin Features

- **Dashboard**: Overview of Shiprocket order statistics
- **Order List**: Detailed view of all orders with Shiprocket status
- **Retry Button**: Manually retry failed Shiprocket orders
- **Tracking Links**: Direct links to Shiprocket tracking pages

## Integration Points

### 1. Checkout Page (`app/checkout/page.jsx`)

After successful payment verification:

```javascript
// Automatically create Shiprocket order
fetch("/api/auto-shiprocket", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ orderNumber: orderResult.orderNumber }),
})
```

### 2. Order Creation (`convex/orders.js`)

Extended with Shiprocket mutations:

- `updateOrderWithShiprocket`: Updates order with Shiprocket details
- `getOrdersWithShiprocket`: Retrieves orders with Shiprocket status

### 3. Shiprocket API (`lib/shiprocket-api.js`)

Core API wrapper with methods:

- `authenticate()`: Get authentication token
- `createOrder()`: Create Shiprocket order
- `checkServiceability()`: Check delivery availability
- `trackOrder()`: Get tracking information

## Testing

### 1. Test Authentication

Visit `/api/test-shiprocket` to verify API credentials.

### 2. Test Order Creation

1. Place a test order with valid shipping details
2. Complete payment (use test mode if available)
3. Check admin interface for Shiprocket status
4. Verify AWB code generation

### 3. Test Error Handling

1. Temporarily use invalid credentials
2. Place an order and verify error handling
3. Check that order creation still succeeds
4. Test retry functionality in admin interface

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD
   - Check if account is active and has API access

2. **Order Creation Failed**
   - Verify pickup pincode is configured in Shiprocket
   - Check if delivery pincode is serviceable
   - Ensure all required fields are present

3. **Missing AWB Code**
   - Some couriers may not generate AWB immediately
   - Check Shiprocket dashboard for order status
   - AWB may be generated after pickup

### Debug Steps

1. Check browser console for errors
2. Review server logs for API responses
3. Use `/api/test-shiprocket` to verify connectivity
4. Check Shiprocket dashboard for order status
5. Use admin interface to retry failed orders

## Production Considerations

1. **Rate Limiting**: Shiprocket has API rate limits
2. **Error Monitoring**: Set up alerts for failed order creation
3. **Backup Process**: Manual order creation process for critical failures
4. **Testing**: Regular testing of integration in staging environment

## Future Enhancements

- [ ] Webhook integration for real-time tracking updates
- [ ] Bulk order creation for existing orders
- [ ] Advanced courier selection based on delivery location
- [ ] Integration with inventory management
- [ ] Automated return order creation
- [ ] SMS notifications with tracking details

## Support

For issues with Shiprocket integration:

1. Check this documentation
2. Review error logs in admin interface
3. Test API connectivity with test endpoint
4. Contact Shiprocket support for API-related issues
5. Check Shiprocket dashboard for order status

---

**Note**: This integration runs automatically in the background. Customers will receive tracking information via email once the order is shipped through Shiprocket.