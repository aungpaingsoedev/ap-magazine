import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      // Serve user uploads from disk before the stale public/ static map.
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
