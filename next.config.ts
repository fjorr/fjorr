import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: false,
  async redirects() {
    return [
      {
        source: '/contact',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
