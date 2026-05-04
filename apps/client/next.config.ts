import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@e-pharmacy/api-client',
    '@e-pharmacy/config',
    '@e-pharmacy/types',
    '@e-pharmacy/ui',
    '@e-pharmacy/utils',
    '@e-pharmacy/validation',
  ],
};

export default nextConfig;
