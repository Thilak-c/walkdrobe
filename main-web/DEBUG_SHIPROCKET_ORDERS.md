# Debug: Orders Not Showing in Shiprocket Dashboard

## Issue
Orders are not appearing in the Shiprocket dashboard after checkout.

## Possible Causes

### 1. Credentials Changed
✅ **FIXED** - Updated to `team@walkdrobe.in`

The credentials were changed from:
- Old: `imdyashodanand2006@gmail.com`
- New: `team@walkdrobe.in`

### 2. Server Not Restarted
⚠️ **ACTION REQUIRED** - Restart your development server

The `.env.local` file was updated, but the server needs to be restarted to pick up the new credentials.

```bash
# Stop the current server (Ctrl+C)
cd main-web
npm run dev
```

### 3. Pickup Location Name
✅ **FIXED** - Changed to "Home"

Shiprocket requires the exact pickup location name from your account. We've updated it to "Home" (pincode 800002).

### 4. Phone Number Format
✅ **FIXED** - Using format `91XXXXXXXXXX`

Indian phone numbers must include country code 91.

## Testing Steps

### Step 1: Verify Credentials
Check that your `.env.local` has:
```env
SHIPROCKET_EMAIL=team@walkdrobe.in
SHIPROCKET_PASSWORD="OtK2gLTjr2T\$N1oT5&w@@hOHn\$R\$3L&4"
SHIPROCKET_PICKUP_PINCODE=800002
```

### Step 2: Restart Server
```bash
# In main-web directory
npm run dev
```

### Step 3: Test with Existing Order
If you have an existing order number, test it:

```bash
curl -X POST http://localhost:3000/api/auto-shiprocket \
  -H "Content-Type: application/json" \
  -d '{"orderNumber": "ORD1768512999281SYDW0"}'
```

Replace `YOUR_ORDER_NUMBER` with an actual order number from your database.

### Step 4: Place New Test Order
1. Go to your website
2. Add item to cart
3. Go to checkout
4. Fill in delivery details
5. Complete payment (or COD)
6. Check browser console for logs:
   ```
   🔄 Redirecting to: /orders/ORD...
   ```
7. Check server logs for:
   ```
   Creating Shiprocket order for: ORD...
   📅 Shiprocket delivery estimate: X days
   ```

### Step 5: Check Shiprocket Dashboard
1. Login to https://app.shiprocket.in/
2. Go to "Orders" section
3. Look for your order by order number
4. Check if it was created

## Common Issues & Solutions

### Issue: "Wrong Pickup location entered"
**Solution:** The pickup location name must match exactly what's in your Shiprocket account.

To check your pickup locations:
1. Login to Shiprocket dashboard
2. Go to Settings → Pickup Addresses
3. Note the exact name (case-sensitive)
4. Update in code if needed

Current setting: `"Home"`

### Issue: "Phone number is in invalid format"
**Solution:** Phone numbers must be in format `91XXXXXXXXXX` (country code + 10 digits)

The code automatically formats phone numbers, but verify in server logs.

### Issue: "Authentication failed"
**Solution:** 
1. Verify credentials in `.env.local`
2. Check if password has special characters that need escaping
3. Restart server after changing credentials

### Issue: Order created but not visible
**Solution:**
1. Check if order status is "pending" - Shiprocket might not show pending orders
2. Check "All Orders" tab in Shiprocket dashboard
3. Search by order number in Shiprocket
4. Check if order was created for correct Shiprocket account

## Debugging Commands

### Check if server is using new credentials:
```bash
# Check server logs when placing order
# Should see: "Creating Shiprocket order for: ORD..."
```

### Test Shiprocket API directly:
```bash
cd main-web
node test-shiprocket-auth.mjs
```

### Check specific order:
```bash
curl -X POST http://localhost:3000/api/auto-shiprocket \
  -H "Content-Type: application/json" \
  -d '{"orderNumber": "ORD1768505595520JSWE9"}'
```

## What Should Happen

### Successful Flow:
1. ✅ User completes checkout
2. ✅ Order created in your database
3. ✅ Auto-shiprocket API called
4. ✅ Shiprocket authenticates with `team@walkdrobe.in`
5. ✅ Order created in Shiprocket
6. ✅ Shiprocket Order ID returned
7. ✅ Database updated with Shiprocket details
8. ✅ Order visible in Shiprocket dashboard

### Server Logs (Success):
```
Creating Shiprocket order for: ORD1768509324525
📅 Shiprocket delivery estimate: 3 days (19/01/2026)
POST /api/auto-shiprocket 200 in 2500ms
```

### API Response (Success):
```json
{
  "success": true,
  "message": "Shiprocket order created successfully",
  "shiprocketOrderId": 1136501572,
  "shipmentId": 1132858745,
  "awbCode": "ABC123456789",
  "courierName": "Delhivery"
}
```

## Next Steps

1. **Restart your server** (most important!)
2. **Place a new test order**
3. **Check server logs** for Shiprocket API calls
4. **Check Shiprocket dashboard** for the order
5. **If still not working**, share the server logs and I'll help debug further

## Quick Test

Run this to test if the API is working:

```bash
# Make sure server is running first!
curl -X POST http://localhost:3000/api/auto-shiprocket \
  -H "Content-Type: application/json" \
  -d '{"orderNumber": "YOUR_LATEST_ORDER_NUMBER"}'
```

If you see `"success": true`, the order should be in Shiprocket!
