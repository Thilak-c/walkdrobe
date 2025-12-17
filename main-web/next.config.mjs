/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["local-origin.dev", "*.local-origin.dev"],
  images: {
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
        pathname: "/api/uploads/**",
      },
      {
        protocol: "https",
        hostname: "*.walkdrobe.in",
        pathname: "/api/uploads/**",
      },
    ],
  },
};

export default nextConfig;
