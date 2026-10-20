import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@soulsync/ui', '@soulsync/shared-types'],
  output: 'standalone',
};

export default nextConfig;
