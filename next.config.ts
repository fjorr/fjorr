import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.fjorr.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/contact",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
