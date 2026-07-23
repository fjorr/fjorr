import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import { DisplayModeProvider } from "@/components/DisplayModeProvider";

export const metadata: Metadata = {
  metadataBase: new URL("https://fjorr.com"),
  title: {
    default: "Fjorr",
    template: "%s | Fjorr",
  },
  description: "Short films of the world’s greatest stories.",
  keywords: ["cinematic films", "myth engine", "historical artifacts", "stories", "short films"],
  authors: [{ name: "Fjorr Team" }],
  creator: "Fjorr",
  openGraph: {
    title: "Fjorr",
    description: "Short films about the world’s greatest stories.",
    url: "https://fjorr.com",
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

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "700"],
  display: "swap",
});

const fontVariables = `${inter.variable} ${jetbrainsMono.variable}`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${fontVariables} dark`}>
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/xyf8acw.css" />
      </head>
      <body className="font-sans antialiased text-light-01 min-h-screen">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <DisplayModeProvider>{children}</DisplayModeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
