# Shiprocket Live Tracking Implementation

## ✅ What Was Implemented

### 1. Shiprocket Tracking API Endpoint
**File:** `main-web/app/api/shiprocket/track/route.js`

Features:
- Fetches real-time tracking data from Shiprocket
- Accepts `orderNumber` or `shipmentId` as query parameters
- Returns tracking activities, AWB code, courier name, delivery status
- Automatically updates order in database with latest tracking info
- Provides tracking URL for external Shiprocket tracking page

**Usage:**
```bash
GET /api/shiprocket/track?orderNumber=ORD1234567890ABCDE
```

**Response:**
```json
{
  "success": true,
  "tracking": {
    "shipmentId": 1132858745,
    "awbCode": "ABC123456789",
    "courierName": "Delhivery",
    "currentStatus": "in_transit",
    "deliveredDate": null,
    "expectedDeliveryDate": "2026-01-20",
    "activities": [
      {
        "date": "2026-01-16 10:30:00",
        "status": "Shipment picked up",
        "location": "Patna, Bihar",
        "srStatus": "6",
        "srStatusLabel": "Picked Up"
      }
    ],
    "trackingUrl": "https://shiprocket.co/tracking/ABC123456789"
  }
}
```

### 2. Order Tracking Page Integration
**File:** `main-web/app/orders/[orderNumber]/page.jsx`

Added:
- State management for Shiprocket tracking data
- `fetchShiprocketTracking()` function to fetch live tracking
- Auto-fetch tracking when order has Shiprocket shipment
- Manual refresh button for latest updates
- Beautiful UI to display tracking information

**Features:**
- **Live Tracking Card** - Shows AWB code, courier name, current status
- **Expected Delivery Date** - From Shiprocket (updated in real-time)
- **Shipment History** - Timeline of all tracking activities
- **Track on Shiprocket** - Direct link to Shiprocket tracking page
- **Refresh Button** - Get latest tracking updates
- **Loading States** - Shows spinner while fetching
- **Error Handling** - Displays friendly error messages

### 3. Shiprocket API Library
**File:** `main-web/lib/shiprocket-api.js`

Added `trackOrder()` method:
```javascript
async trackOrder(shipmentId) {
  const response = await this.makeRequest(`/courier/track/shipment/${shipmentId}`);
  return response;
}
```

## 📋 How It Works

### Flow:
1. **Order Created** → Shiprocket order created automatically
2. **Shipment ID Stored** → In order.shiprocketDetails.shipmentId
3. **User Views Order** → `/orders/[orderNumber]` page loads
4. **Auto-Fetch Tracking** → Calls `/api/shiprocket/track` API
5. **Display Live Data** → Shows real-time tracking from Shiprocket
6. **Manual Refresh** → User can click refresh for latest updates
7. **Database Updated** → Latest tracking info saved to order

### Data Displayed:
- ✅ AWB (Airway Bill) Code
- ✅ Courier Partner Name
- ✅ Current Shipment Status
- ✅ Expected Delivery Date (from Shiprocket)
- ✅ Shipment History Timeline
- ✅ Location Updates
- ✅ Direct Tracking Link

## 🎨 UI Components

### Live Tracking Card
```
┌─────────────────────────────────────┐
│ 📦 Live Tracking        [Refresh]   │
├─────────────────────────────────────┤
│ AWB Code:    ABC123456789           │
│ Courier:     Delhivery              │
│ Status:      In Transit             │
│ Expected:    20 Jan 2026            │
│                                     │
│ [Track on Shiprocket →]            │
├─────────────────────────────────────┤
│ Shipment History                    │
│                                     │
│ • Shipment picked up                │
│   📍 Patna, Bihar                   │
│   16 Jan 2026, 10:30 AM            │
│                                     │
│ • In transit                        │
│   📍 Delhi Hub                      │
│   16 Jan 2026, 6:45 PM             │
└─────────────────────────────────────┘
```

## 🔧 Configuration

### Environment Variables Required:
```env
SHIPROCKET_EMAIL=your-email@example.com
SHIPROCKET_PASSWORD=your-password
CONVEX_SELF_HOSTED_URL=your-convex-url
CONVEX_SELF_HOSTED_ADMIN_KEY=your-admin-key
```

## 🚀 Testing

### Test Tracking API:
```bash
# Test with order number
curl "http://localhost:3000/api/shiprocket/track?orderNumber=ORD1768505595520JSWE9"

# Test with shipment ID
curl "http://localhost:3000/api/shiprocket/track?shipmentId=1132858745"
```

### Expected Behavior:
1. Navigate to `/orders/[orderNumber]`
2. See "Live Tracking" card if Shiprocket order exists
3. Tracking data loads automatically
4. Click "Refresh" to get latest updates
5. Click "Track on Shiprocket" to open external tracking page

## 📊 Database Updates

The tracking API automatically updates the order with:
- Latest AWB code
- Current courier name
- Current shipment status
- Last tracked timestamp
- Updated expected delivery date

## 🎯 Benefits

1. **Real-Time Updates** - Users see actual shipment status
2. **Transparency** - Complete tracking history visible
3. **Reduced Support** - Users can self-serve tracking info
4. **Accurate ETAs** - Delivery dates from courier partners
5. **Professional** - Direct integration with Shiprocket
6. **Automatic** - No manual intervention needed

## 🔄 Auto-Refresh (Optional Enhancement)

To add auto-refresh every 5 minutes:

```javascript
useEffect(() => {
  if (!order?.shiprocketDetails?.shipmentId) return;
  
  // Initial fetch
  fetchShiprocketTracking();
  
  // Auto-refresh every 5 minutes
  const interval = setInterval(() => {
    fetchShiprocketTracking();
  }, 5 * 60 * 1000);
  
  return () => clearInterval(interval);
}, [order?.shiprocketDetails?.shipmentId]);
```

## ✅ Status

| Feature | Status | Location |
|---------|--------|----------|
| Tracking API endpoint | ✅ Complete | `api/shiprocket/track/route.js` |
| Order page integration | ✅ Complete | `orders/[orderNumber]/page.jsx` |
| Live tracking display | ✅ Complete | UI component added |
| Shipment history | ✅ Complete | Timeline view |
| AWB & courier info | ✅ Complete | Displayed in card |
| External tracking link | ✅ Complete | Button added |
| Manual refresh | ✅ Complete | Refresh button |
| Error handling | ✅ Complete | Error states |
| Loading states | ✅ Complete | Spinner added |
| Database updates | ✅ Complete | Auto-updates order |

---

**All features are complete and ready to test!**

Just restart the server and navigate to any order with a Shiprocket shipment to see live tracking.
