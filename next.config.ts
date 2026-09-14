import type { NextConfig } from "next";
import path from "path";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Pin Turbopack to this app — a stray ~/package-lock.json otherwise wins the root.
  turbopack: {
    root: path.join(__dirname),
  },
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
    const cut = (source: string, destination: string, permanent = true) => [
      { source, destination, permanent },
      {
        source: `${localePrefix}${source}`,
        destination: destination === "/" ? "/:locale" : `/:locale${destination}`,
        permanent,
      },
    ];
    return [
      ...cut("/contact", "/about"),
      ...cut("/search", "/"),
      // Launch cut — archived / deleted surfaces
      ...cut("/nominate", "/"),
      ...cut("/plus", "/"),
      ...cut("/bounties", "/"),
      ...cut("/bounties/:slug", "/"),
      ...cut("/cabinet", "/"),
      ...cut("/bureau", "/bureaux"),
      ...cut("/manual", "/about"),
      ...cut("/manual/:slug", "/about"),
      ...cut("/help", "/about"),
      ...cut("/help/:slug", "/about"),
      ...cut("/principles", "/about"),
      ...cut("/manual/principles", "/about"),
      ...cut("/help/principles", "/about"),
      ...cut("/account/plus", "/account/voyages"),
      ...cut("/account/cabinet", "/account/voyages"),
      ...cut("/account/profile", "/account/bureaux"),
      ...cut("/account/privacy", "/account/voyages"),
      ...cut("/account/logs", "/account/voyages"),
      ...cut("/account/recut", "/account/voyages"),
      ...cut("/bureaux/gift/:token", "/bureaux"),
      // Legacy account profile URLs → public Bureaux profile paths
      {
        source: "/account/:memberNumber(\\d+)",
        destination: "/:memberNumber",
        permanent: true,
      },
      {
        source: `${localePrefix}/account/:memberNumber(\\d+)`,
        destination: "/:locale/:memberNumber",
        permanent: true,
      },
      {
        source: "/account/:memberNumber(\\d+)/:slug",
        destination: "/:memberNumber/:slug",
        permanent: true,
      },
      {
        source: `${localePrefix}/account/:memberNumber(\\d+)/:slug`,
        destination: "/:locale/:memberNumber/:slug",
        permanent: true,
      },
      ...cut("/admin", "/"),
      ...cut("/admin/:path*", "/"),
    ];
  },
};

export default withNextIntl(nextConfig);
