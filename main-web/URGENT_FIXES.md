# URGENT Performance Fixes

## 1. COMPRESS HERO IMAGES (CRITICAL - 30MB → 2MB)

Your hero images are killing performance:
- TAS_4315.jpg: 7.2MB → Should be < 500KB
- TAS_4337.jpg: 7.1MB → Should be < 500KB  
- TAS_4282.jpg: 6.2MB → Should be < 500KB
- TAS_4296.jpg: 5.6MB → Should be < 500KB
- TAS_4324.jpg: 4.8MB → Should be < 500KB

### Solution:
```bash
# Use TinyPNG or ImageOptim to compress
# Or use this online tool: https://tinypng.com/

# Target sizes:
# Mobile: 800x1200px, < 200KB, WebP format
# Desktop: 1920x1080px, < 400KB, WebP format
```

## 2. RESIZE PRODUCT IMAGES (1.7MB savings)

Product images are 1200x1600px but displayed at 196x245px!

### Solution:
Create thumbnails on upload:
```javascript
// In your upload API
const sharp = require('sharp');

// Create thumbnail
await sharp(inputBuffer)
  .resize(400, 533, { fit: 'cover' })
  .webp({ quality: 80 })
  .toFile('product_thumb.webp');
```

## 3. ENABLE HTTP/2 on insys.walkdrobe.in

Your image server uses HTTP/1.1 (slow). Enable HTTP/2 in nginx/apache.

### Nginx config:
```nginx
server {
    listen 443 ssl http2;
    # ... rest of config
}
```

## 4. REDUCE JAVASCRIPT BUNDLE

Framer Motion is causing 4+ seconds of blocking time.

### Solution:
```bash
# Use lighter animation library or lazy load
npm install react-spring  # Lighter alternative
```

## 5. ADD CACHING HEADERS

Images have no cache headers.

### Add to insys.walkdrobe.in:
```nginx
location /api/uploads/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Expected Results After Fixes:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| LCP    | 3.0s   | 0.8s  | 3.75x faster |
| TBT    | 9,550ms| 500ms | 19x faster   |
| FCP    | 1.6s   | 0.4s  | 4x faster    |
| Score  | 54     | 90+   | 67% better   |

## Priority Order:

1. ✅ Compress hero images (30MB → 2MB) - **BIGGEST WIN**
2. ✅ Convert to WebP format
3. ✅ Resize product images  
4. ✅ Enable HTTP/2 on image server
5. ✅ Add cache headers
6. ✅ Lazy load Framer Motion
