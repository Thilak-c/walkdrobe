# 🐛 Debug Checkout Issues

## 🔍 **Issue 1: Still Redirecting to Order Success Page**

### **Possible Causes:**
1. **Browser Cache** - Old JavaScript cached
2. **Server Cache** - Next.js build cache
3. **Service Worker** - PWA caching
4. **Multiple Redirect Paths** - Other code paths

### **Debug Steps:**

#### **Step 1: Clear All Caches**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
npm run dev

# Or just restart dev server
Ctrl+C
npm run dev
```

#### **Step 2: Check Browser**
1. **Hard Refresh:** `Ctrl+Shift+R` (Chrome) or `Cmd+Shift+R` (Mac)
2. **Clear Cache:** Browser Settings → Clear browsing data
3. **Incognito Mode:** Test in private/incognito window
4. **Disable Cache:** DevTools → Network tab → "Disable cache"

#### **Step 3: Verify Code Changes**
Check these files have the correct redirects:

**File: `main-web/app/checkout/page.jsx`**
```javascript
// Should be:
setTimeout(() => router.push(`/orders/${orderResult.orderNumber}`), 1500);

// NOT:
setTimeout(() => router.push(`/order-success?orderNumber=${orderResult.orderNumber}`), 1500);
```

#### **Step 4: Check Network Tab**
1. Open DevTools → Network tab
2. Complete a test order
3. Look for redirect responses
4. Check if it's going to `/orders/[orderNumber]` or `/order-success`

---

## 🗓️ **Issue 2: Expected Date Doesn't Match**

### **Root Cause Analysis:**

The system has **two delivery date calculations**:

1. **Initial Calculation** (in `convex/orders.js`):
   - Used when order is first created
   - Generic 3-5 business days

2. **Shiprocket Update** (in `auto-shiprocket` API):
   - Gets real estimate from courier
   - Updates the order with actual delivery date

### **The Problem:**
If Shiprocket integration fails or doesn't update the delivery date, the order shows the initial generic estimate instead of the real one.

### **Debug Steps:**

#### **Step 1: Check Shiprocket Integration**
```bash
# Test if Shiprocket is updating delivery dates
curl -X POST http://localhost:3000/api/auto-shiprocket \
  -H "Content-Type: application/json" \
  -d '{"orderNumber": "YOUR_ORDER_NUMBER"}'
```

**Expected Response:**
```json
{
  "success": true,
  "estimatedDeliveryDate": 1234567890,
  "debug": {
    "deliveryEstimateUpdated": true
  }
}
```

#### **Step 2: Check Serviceability API**
```bash
# Test delivery estimate for a pincode
curl "http://localhost:3000/api/shiprocket/serviceability?pincode=110001"
```

**Expected Response:**
```json
{
  "deliverable": true,
  "estimatedDays": "3",
  "codAvailable": true
}
```

#### **Step 3: Check Order in Database**
1. Go to admin interface: `/admin/shiprocket`
2. Find your order
3. Check if `estimatedDeliveryDate` was updated
4. Compare with Shiprocket dashboard

#### **Step 4: Manual Fix**
If automatic update fails, you can manually trigger it:

```bash
# Retry Shiprocket integration for an order
curl -X POST http://localhost:3000/api/auto-shiprocket \
  -H "Content-Type: application/json" \
  -d '{"orderNumber": "YOUR_ORDER_NUMBER"}'
```

---

## 🔧 **Quick Fixes:**

### **Fix 1: Force Redirect Update**
```javascript
// In checkout page, add immediate redirect (no timeout)
if (orderResult?.success) {
  window.location.href = `/orders/${orderResult.orderNumber}`;
}
```

### **Fix 2: Force Delivery Date Update**
```javascript
// In auto-shiprocket API, add fallback calculation
if (!actualDeliveryEstimate) {
  // Fallback: 3 days from now
  const fallbackDate = new Date();
  fallbackDate.setDate(fallbackDate.getDate() + 3);
  actualDeliveryEstimate = fallbackDate.getTime();
}
```

---

## 🧪 **Test Scenarios:**

### **Scenario 1: Complete New Order**
1. Clear all caches
2. Place new order
3. Check redirect destination
4. Verify delivery date matches Shiprocket

### **Scenario 2: Existing Order**
1. Use existing order number
2. Call auto-shiprocket API manually
3. Check if delivery date updates
4. Verify in admin interface

### **Scenario 3: Different Pincodes**
1. Test with different delivery pincodes
2. Check if delivery estimates vary
3. Verify dates match Shiprocket dashboard

---

## 📋 **Verification Checklist:**

- [ ] **Server restarted** - Fresh Next.js build
- [ ] **Browser cache cleared** - Hard refresh done
- [ ] **Network tab checked** - Actual redirect verified
- [ ] **Shiprocket API working** - Authentication successful
- [ ] **Serviceability working** - Returns delivery estimates
- [ ] **Database updated** - Order has correct delivery date
- [ ] **Admin interface** - Shows updated information

---

## 🚨 **If Still Not Working:**

### **Emergency Fallback:**
1. **Disable auto-redirect** - Let users manually click
2. **Show both dates** - Generic + Shiprocket estimate
3. **Manual update** - Admin can update delivery dates
4. **Email fallback** - Send updated tracking info separately

### **Contact Points:**
1. Check server logs for errors
2. Check Shiprocket dashboard for orders
3. Test with different browsers
4. Test with different devices

---

**The integration should work correctly after clearing caches and restarting the server!** 🚀