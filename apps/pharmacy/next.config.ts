import type { NextConfig } from 'next';

//===============================================================

const apiBaseUrl = (
  process.env.API_BASE_URL ?? 'http://localhost:4000'
).replace(/\/+$/, '');

//===============================================================

const nextConfig: NextConfig = {
  transpilePackages: [
    '@e-pharmacy/api-client',
    '@e-pharmacy/auth',
    '@e-pharmacy/config',
    '@e-pharmacy/hooks',
    '@e-pharmacy/next-api',
    '@e-pharmacy/types',
    '@e-pharmacy/ui',
    '@e-pharmacy/utils',
    '@e-pharmacy/validation',
  ],

  async rewrites() {
    return [
      {
        source: '/images/seed/products/:path*',
        destination: `${apiBaseUrl}/images/seed/products/:path*`,
      },
      {
        source: '/images/seed/clients/:path*',
        destination: `${apiBaseUrl}/images/seed/clients/:path*`,
      },
    ];
  },
};

//===============================================================

export default nextConfig;
