/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'walkdrobe.in', 'insys.walkdrobe.in'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
