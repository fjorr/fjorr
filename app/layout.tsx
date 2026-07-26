import type { Metadata } from "next";
import "./globals.css";
import { SITE_ORIGIN } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: "Fjorr",
    template: "%s | Fjorr",
  },
  description: "Short films of the world’s greatest stories.",
  keywords: ["cinematic films", "myth engine", "historical artifacts", "stories", "short films"],
  authors: [{ name: "Fjorr Team" }],
  creator: "Fjorr",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Fjorr",
    description: "Short films about the world’s greatest stories.",
    url: SITE_ORIGIN,
    siteName: "Fjorr",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Fjorr Cinematic Myth Engine Preview Layout",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fjorr",
    description: "Short films about the world’s greatest stories.",
    images: ["/opengraph-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

/** Thin root — `[locale]` / embed / gate own the html shell + providers. */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
