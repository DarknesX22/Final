import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'coin-images.coingecko.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'assets.coingecko.com' },
      { protocol: 'https', hostname: 'images.cointelegraph.com' },
      { protocol: 'https', hostname: 'www.coindesk.com' },
      { protocol: 'https', hostname: 'cdn.decrypt.co' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/flask-api/:path*',
        destination: 'http://localhost:5000/:path*',
      },
    ];
  },
};

export default nextConfig;
