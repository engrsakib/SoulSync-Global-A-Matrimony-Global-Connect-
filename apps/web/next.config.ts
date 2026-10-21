import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@soulsync/ui', '@soulsync/shared-types'],
  output: 'standalone',
  redirects() {
    return [
      { source: '/profile', destination: '/dashboard/profile', permanent: true },
      { source: '/profile/settings', destination: '/dashboard/settings', permanent: true },
    ];
  },
};

export default nextConfig;
