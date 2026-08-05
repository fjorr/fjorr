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
    const localePrefix = "/:locale(es|fr|it|de|pt|sv|hi|ko|ja|zh-tw)";
    return [
      {
        source: "/contact",
        destination: "/",
        permanent: true,
      },
      {
        source: `${localePrefix}/contact`,
        destination: "/:locale",
        permanent: true,
      },
      {
        source: "/search",
        destination: "/",
        permanent: true,
      },
      {
        source: `${localePrefix}/search`,
        destination: "/:locale",
        permanent: true,
      },
      {
        source: "/manual/principles",
        destination: "/principles",
        permanent: true,
      },
      {
        source: `${localePrefix}/manual/principles`,
        destination: "/:locale/principles",
        permanent: true,
      },
      {
        source: "/help/principles",
        destination: "/principles",
        permanent: true,
      },
      {
        source: `${localePrefix}/help/principles`,
        destination: "/:locale/principles",
        permanent: true,
      },
      {
        source: "/help",
        destination: "/manual",
        permanent: true,
      },
      {
        source: `${localePrefix}/help`,
        destination: "/:locale/manual",
        permanent: true,
      },
      {
        source: "/help/:slug",
        destination: "/manual/:slug",
        permanent: true,
      },
      {
        source: `${localePrefix}/help/:slug`,
        destination: "/:locale/manual/:slug",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
