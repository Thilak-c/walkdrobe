# Shiprocket API Test Project

A Node.js project for testing Shiprocket API integration.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from example:
```bash
cp .env.example .env
```

3. Add your Shiprocket API credentials to `.env`:
- Get credentials from Shiprocket Dashboard → Settings → API → Create API User

## Usage

### Run all tests
```bash
npm start
```

### Individual modules
```bash
npm run auth      # Test authentication
npm run orders    # Test orders API
npm run shipping  # Test shipping rates
npm run tracking  # Test tracking (pass AWB as argument)
```

### Tracking with AWB
```bash
node src/tracking.js YOUR_AWB_NUMBER
```

## API Modules

| Module | Description |
|--------|-------------|
| `auth.js` | Authentication & token generation |
| `orders.js` | Create, list, cancel orders |
| `shipping.js` | Rates, courier assignment, labels |
| `tracking.js` | Track shipments by AWB/Order ID |
| `pickup.js` | Manage pickup locations |
| `returns.js` | Handle return orders |

## Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 422 | Unprocessable Entity |
| 429 | Rate Limited |

## Webhook Setup

Configure webhooks in Shiprocket Dashboard → Settings → API → Webhooks

Sample webhook payload structure is documented in the Shiprocket API docs.
