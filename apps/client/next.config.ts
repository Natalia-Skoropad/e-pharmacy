import type { NextConfig } from 'next';

//===============================================================

const nextConfig: NextConfig = {
  transpilePackages: [
    '@e-pharmacy/api-client',
    '@e-pharmacy/auth',
    '@e-pharmacy/config',
    '@e-pharmacy/hooks',
    '@e-pharmacy/types',
    '@e-pharmacy/ui',
    '@e-pharmacy/utils',
    '@e-pharmacy/validation',
  ],

  async redirects() {
    return [
      {
        source: '/medicines-catalog/:path*',
        destination: '/product-catalog/:path*',
        permanent: true,
      },
      {
        source: '/products-catalog/:path*',
        destination: '/product-catalog/:path*',
        permanent: true,
      },
      {
        source: '/pharmacy-stores/:path*',
        destination: '/pharmacies/:path*',
        permanent: true,
      },
      {
        source: '/stores/:path*',
        destination: '/pharmacies/:path*',
        permanent: true,
      },
      {
        source: '/pharmacy-shops/:path*',
        destination: '/pharmacies/:path*',
        permanent: true,
      },
      {
        source: '/shops/:path*',
        destination: '/pharmacies/:path*',
        permanent: true,
      },
    ];
  },

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
