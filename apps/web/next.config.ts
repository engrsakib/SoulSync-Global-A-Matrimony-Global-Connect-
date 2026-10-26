import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@soulsync/ui', '@soulsync/shared-types'],
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  redirects() {
    return [
      { source: '/profile', destination: '/dashboard/profile', permanent: true },
      { source: '/profile/settings', destination: '/dashboard/settings', permanent: true },
      { source: '/system/terms-condition', destination: '/system/terms', permanent: true },
      // Do not add case-variant redirects (e.g. PRIVACY-policy → privacy-policy): Next matches
      // sources case-insensitively on Windows and loops on the canonical URL.
      { source: '/system/sefety', destination: '/system/safety', permanent: true },
    ];
  },
};

export default nextConfig;
