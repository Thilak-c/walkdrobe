# Pincode Delivery Check Feature

This feature integrates with Shiprocket API to check delivery availability for user-entered pincodes during checkout.

## Features

- **Real-time Pincode Validation**: Automatically checks delivery availability as user types
- **Visual Feedback**: Shows loading, success, and error states with icons
- **Delivery Information**: Displays estimated delivery days, COD availability, and courier partner count
- **Checkout Validation**: Prevents order placement if delivery is not available
- **COD Validation**: Checks if Cash on Delivery is available for the pincode

## Implementation

### API Endpoint
- **GET** `/api/shiprocket/serviceability?pincode={pincode}&pickup_pincode={pickup}&weight={weight}`
- **POST** `/api/shiprocket/serviceability` (existing functionality preserved)

### Components
- **PincodeDeliveryCheck.jsx**: Standalone component for pincode checking
- **Enhanced Checkout Form**: Integrated pincode validation in checkout page

### Utilities
- **pincodeUtils.js**: Helper functions for pincode validation and API calls

## Usage

### In Checkout Page
The pincode delivery check is automatically integrated into the checkout form:

1. User enters pincode in the delivery address form
2. System automatically checks delivery availability after 500ms delay
3. Visual feedback shows checking status, success, or error
4. Checkout is blocked if delivery is not available

### Standalone Component
```jsx
import PincodeDeliveryCheck from '@/components/PincodeDeliveryCheck';

function MyComponent() {
  const handleDeliveryCheck = (isDeliverable, data) => {
    console.log('Delivery available:', isDeliverable);
  };

  return (
    <PincodeDeliveryCheck onDeliveryCheck={handleDeliveryCheck} />
  );
}
```

### Utility Functions
```javascript
import { checkPincodeDelivery, isValidPincode } from '@/utils/pincodeUtils';

// Validate pincode format
const isValid = isValidPincode('400001'); // true

// Check delivery availability
const deliveryInfo = await checkPincodeDelivery('400001');
```

## Configuration

### Environment Variables
```env
SHIPROCKET_EMAIL=your_email@example.com
SHIPROCKET_PASSWORD=your_password
SHIPROCKET_BASE_URL=https://apiv2.shiprocket.in/v1/external
NEXT_PUBLIC_DEFAULT_PICKUP_PINCODE=400001
```

### Default Settings
- **Pickup Pincode**: 400001 (Mumbai) - can be configured
- **Default Weight**: 0.5kg - adjustable per product
- **COD Check**: Enabled by default

## API Response Format

### Success Response
```json
{
  "deliverable": true,
  "pincode": "400001",
  "courierPartners": [...],
  "estimatedDays": "2-3",
  "codAvailable": true,
  "message": "Delivery available to this pincode"
}
```

### Error Response
```json
{
  "deliverable": false,
  "pincode": "999999",
  "message": "Delivery not available to this pincode",
  "error": "Invalid pincode or no courier partners available"
}
```

## Testing

### Test Page
Visit `/test-pincode` to test the pincode delivery check functionality.

### Test Pincodes
- **Available**: 400001 (Mumbai), 110001 (Delhi), 560001 (Bangalore)
- **Unavailable**: Try remote area pincodes or invalid formats

## Error Handling

- **Invalid Format**: Shows error for non-6-digit pincodes
- **Network Errors**: Graceful handling with retry suggestions
- **API Errors**: Clear error messages from Shiprocket API
- **Timeout**: 500ms debounce to prevent excessive API calls

## Integration Points

1. **Checkout Form**: Automatic validation during address entry
2. **Order Creation**: Blocks order if delivery unavailable
3. **COD Orders**: Additional check for COD availability
4. **User Experience**: Real-time feedback with visual indicators

## Future Enhancements

- [ ] Multiple pickup location support
- [ ] Delivery cost estimation
- [ ] Express delivery options
- [ ] Pincode-based product availability
- [ ] Delivery time slot selection
- [ ] Bulk pincode validation for admin

## Troubleshooting

### Common Issues
1. **API Authentication**: Ensure Shiprocket credentials are correct
2. **Network Timeout**: Check internet connection and API status
3. **Invalid Pincode**: Verify pincode format and existence
4. **COD Unavailable**: Some areas don't support Cash on Delivery

### Debug Mode
Enable console logging to see API responses:
```javascript
console.log('Pincode check result:', deliveryData);
```