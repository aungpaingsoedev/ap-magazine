import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
    ],
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/uploads/:filename',
          destination: '/api/files/:filename',
        },
      ],
    };
  },
};

export default nextConfig;
