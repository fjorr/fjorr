import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Fjorr",
  description: "Built piece-by-piece from precise designs.",
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ['300', '400', '500', '700', '800'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ['300', '400', '500', '700', '800'],
});

const fontVariables = `${inter.variable} ${jetbrainsMono.variable}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  console.log("--- 🕵️‍♂️ ENV KEY DEBUGGER ---");
  console.log("All environment keys found:", Object.keys(process.env));
  console.log("--------------------------");

  return (
    <html lang="en" className={`${fontVariables} dark`}>
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/xyf8acw.css" />
      </head>
      {/* 🎯 THE FIX: Removed 'bg-dark-01' from the body tag completely.
          This leaves the canvas background clear so that your local layout folders 
          can render their own solid background colors with zero clipping! */}
      <body className="font-sans antialiased text-light-01 min-h-screen">
        {children}
      </body>
    </html>
  );
}