import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  cacheComponents: false,
  images: {
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.fjorr.com",
      },
    ],
  },
  async headers() {
    return [
      {
        // Allow partner sites to iframe /embed/* (omit X-Frame-Options; CSP controls this).
        source: '/embed/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: 'frame-ancestors *',
          },
        ],
      },
    ];
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

export default withNextIntl(nextConfig);
