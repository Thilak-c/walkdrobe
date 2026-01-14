/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["local-origin.dev", "*.local-origin.dev"],
  images: {
    // Enable image optimization
    formats: ['image/avif', 'image/webp'],
    // Device sizes for responsive images
    deviceSizes: [320, 420, 640, 768, 1024, 1280, 1536],
    // Image sizes for srcset
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/api/uploads/**",
      },
      {
        protocol: "https",
        hostname: "walkdrobe.in",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.walkdrobe.in",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "insys.walkdrobe.in",
        pathname: "/**",
      },
      // Common CDNs (in case you use them)
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
