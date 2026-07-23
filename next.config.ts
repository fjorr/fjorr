import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

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

export default withNextIntl(nextConfig);
