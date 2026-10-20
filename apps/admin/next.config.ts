import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@soulsync/ui'],
  output: 'standalone',
};

export default nextConfig;
