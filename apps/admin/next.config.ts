import type { NextConfig } from 'next';

import {
  resolveApiBaseUrl,
  resolveNodeEnvironment,
} from '../../packages/next-api/src/contracts/api-base-url';

//===============================================================

const apiBaseUrl = resolveApiBaseUrl(
  process.env.API_BASE_URL,
  resolveNodeEnvironment(process.env.NODE_ENV),
  { allowInsecureLoopbackInProduction: true }
).replace(/\/+$/, '');

//===============================================================

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/images/seed/:path*',
        destination: `${apiBaseUrl}/images/seed/:path*`,
      },
    ];
  },

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
};

//===============================================================

export default nextConfig;
