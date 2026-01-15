# Shiprocket Integration Test Guide

## Quick Test Steps

### 1. Test Authentication
Visit: `http://localhost:3000/api/test-shiprocket`

**Expected Response:**
```json
{
  "success": true,
  "message": "Shiprocket authentication successful",
  "tokenLength": 1234,
  "tokenPreview": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### 2. Test Serviceability Check
Visit: `http://localhost:3000/api/shiprocket/serviceability?pincode=110001`

**Expected Response:**
```json
{
  "deliverable": true,
  "pincode": "110001",
  "courierPartners": [...],
  "codAvailable": true,
  "message": "Delivery available to this pincode"
}
```

### 3. Test Complete Order Flow

#### Place a Test Order:
1. Go to your website checkout page
2. Fill in shipping details:
   - **Name:** Test Customer
   - **Email:** test@example.com
   - **Phone:** 9999999999
   - **Address:** 123 Test Street
   - **City:** Delhi
   - **Pincode:** 110001
   - **State:** Delhi

3. Choose **Cash on Delivery** payment method
4. Complete the order

#### Expected Behavior:
- Order should be created successfully
- You should see: `POST /api/auto-shiprocket 200` in server logs
- Shiprocket order should be created automatically

### 4. Check Admin Interface
Visit: `http://localhost:3000/admin/shiprocket`

**You should see:**
- Dashboard with order statistics
- List of recent orders
- Shiprocket status for each order
- AWB codes (if generated)
- Retry buttons for failed orders

### 5. Manual Retry Test
1. In admin interface, find an order without Shiprocket details
2. Click "Create Order" button
3. Should see success message and AWB code

## Test Scenarios

### Scenario 1: Online Payment Order
- Place order with online payment (UPI/Card)
- Payment should complete successfully
- Shiprocket order should be created automatically
- Check admin interface for AWB code

### Scenario 2: COD Order
- Place order with Cash on Delivery
- Order should be created with "pending" payment status
- Shiprocket order should still be created (COD is valid)
- Check admin interface for AWB code

### Scenario 3: Failed Order Recovery
- If Shiprocket creation fails, order should still complete
- Error should be logged in database
- Admin can retry from admin interface
- Retry should work and generate AWB code

## Troubleshooting

### Common Issues:

1. **Authentication Failed**
   ```
   Check .env.local:
   SHIPROCKET_EMAIL=imdyashodanand2006@gmail.com
   SHIPROCKET_PASSWORD=UFiPv8Mh*z$K9zU574CCt3Ep!WKwgz@n
   ```

2. **Order Creation Failed**
   - Check if pickup pincode (800002) is configured in Shiprocket
   - Verify delivery pincode is serviceable
   - Check server logs for detailed error

3. **No AWB Code**
   - Some couriers generate AWB after pickup
   - Check Shiprocket dashboard directly
   - May take a few minutes to generate

### Debug Commands:

```bash
# Check server logs
tail -f .next/server.log

# Test API endpoints
curl http://localhost:3000/api/test-shiprocket
curl "http://localhost:3000/api/shiprocket/serviceability?pincode=110001"
```

## Success Criteria

✅ **Integration is working if:**
- Authentication test passes
- Serviceability check works for valid pincodes
- Orders create Shiprocket entries automatically
- Admin interface shows order status
- AWB codes are generated (may take time)
- Failed orders can be retried successfully

## Production Checklist

- [ ] Test with real order data
- [ ] Verify pickup location is configured
- [ ] Test different delivery pincodes
- [ ] Check email notifications include tracking
- [ ] Test error handling and recovery
- [ ] Monitor for rate limiting issues
- [ ] Set up alerts for failed order creation

---

**Note:** The integration is designed to be non-blocking. Even if Shiprocket fails, customer orders will complete successfully.