import type { NextConfig } from 'next';

import {
  resolveApiBaseUrl,
  resolveNodeEnvironment,
} from '../../packages/next-api/src/contracts/api-base-url';

//===============================================================

const nodeEnv = resolveNodeEnvironment(process.env.NODE_ENV);

const apiBaseUrl = resolveApiBaseUrl(process.env.API_BASE_URL, nodeEnv, {
  // Next runs `next build` with NODE_ENV=production even for a local build.
  // Allow only loopback HTTP here so local production-build verification can
  // target the local API. Server runtime validation remains strict by default.
  allowInsecureLoopbackInProduction: true,
}).replace(/\/+$/, '');

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
