#!/bin/bash

echo "🧪 Testing Shiprocket Order Creation"
echo "===================================="
echo ""
echo "Order Number: ORD1768512999281SYDW0"
echo "Pickup Location: warehouse"
echo ""

curl -X POST http://localhost:3000/api/auto-shiprocket \
  -H "Content-Type: application/json" \
  -d '{"orderNumber": "ORD1768512999281SYDW0"}' \
  | python3 -m json.tool

echo ""
echo ""
echo "✅ If you see 'success: true' and shiprocketOrderId, check your Shiprocket dashboard!"
echo "🌐 https://app.shiprocket.in/"
