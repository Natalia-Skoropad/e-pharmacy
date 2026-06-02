import type { NextConfig } from 'next';

//===============================================================

const nextConfig: NextConfig = {
  htmlLimitedBots: /.*/,
  images: {
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

//===============================================================

export default nextConfig;
