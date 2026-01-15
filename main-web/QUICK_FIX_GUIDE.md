# Quick Fix: Orders Not in Shiprocket Dashboard

## The Problem
Your Shiprocket credentials were updated to `team@walkdrobe.in`, but the server is still using the old cached credentials.

## The Solution (3 Steps)

### Step 1: Restart Your Server ⚠️ CRITICAL
```bash
# Stop the current server (press Ctrl+C in the terminal running npm run dev)
# Then restart:
cd main-web
npm run dev
```

**Why?** The server loads environment variables when it starts. Changing `.env.local` doesn't update a running server.

### Step 2: Test with an Existing Order
Find an order number from your database (format: `ORD1768505595520JSWE9`) and run:

```bash
curl -X POST http://localhost:3000/api/auto-shiprocket \
  -H "Content-Type: application/json" \
  -d '{"orderNumber": "YOUR_ORDER_NUMBER_HERE"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Shiprocket order created successfully",
  "shiprocketOrderId": 1136501572,
  "shipmentId": 1132858745
}
```

### Step 3: Check Shiprocket Dashboard
1. Go to https://app.shiprocket.in/
2. Login with `team@walkdrobe.in`
3. Click "Orders" in the left menu
4. Search for your order number
5. You should see it there!

## Still Not Working?

### Check Server Logs
When you place an order or call the API, you should see:
```
Creating Shiprocket order for: ORD...
📅 Shiprocket delivery estimate: 3 days
POST /api/auto-shiprocket 200 in 2500ms
```

### Check for Errors
If you see errors like:
- **"Wrong Pickup location entered"** → Pickup location name doesn't match your Shiprocket account
- **"Phone number is in invalid format"** → Phone format issue (should be `91XXXXXXXXXX`)
- **"Authentication failed"** → Credentials issue (check `.env.local`)

### Verify Pickup Location
1. Login to Shiprocket dashboard
2. Go to **Settings → Pickup Addresses**
3. Check the exact name of your pickup location
4. It should be **"Home"** (case-sensitive)
5. If different, update in `.env.local`:
   ```env
   SHIPROCKET_PICKUP_LOCATION_NAME=YourExactName
   ```

## Test Order Creation

Place a new test order:
1. Add item to cart
2. Go to checkout
3. Fill delivery details (use pincode 800001 for testing)
4. Complete payment or COD
5. Watch browser console for: `🔄 Redirecting to: /orders/ORD...`
6. Watch server logs for: `Creating Shiprocket order for: ORD...`
7. Check Shiprocket dashboard

## Current Configuration

Your `.env.local` is correctly set to:
```env
SHIPROCKET_EMAIL=team@walkdrobe.in
SHIPROCKET_PASSWORD="OtK2gLTjr2T\$N1oT5&w@@hOHn\$R\$3L&4"
SHIPROCKET_PICKUP_PINCODE=800002
```

Pickup location in code: **"Home"**

## What Happens After Checkout

1. ✅ Order created in your database
2. ✅ `/api/auto-shiprocket` called automatically
3. ✅ Authenticates with Shiprocket using `team@walkdrobe.in`
4. ✅ Creates order in Shiprocket
5. ✅ Gets shipment ID and AWB code
6. ✅ Updates your database with Shiprocket details
7. ✅ Order appears in Shiprocket dashboard

## Need Help?

If after restarting the server it still doesn't work:
1. Share the server logs when placing an order
2. Share the response from the curl command
3. Check if the order exists in your database but not in Shiprocket

---

**TL;DR: Restart your server! That's the most common issue. 🔄**
