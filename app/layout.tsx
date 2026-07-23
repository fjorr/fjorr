import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { DisplayModeProvider } from "@/components/DisplayModeProvider";
import { DISPLAY_MODE_COOKIE, parseDisplayMode } from "@/lib/display-mode";

// Fallback constant left clean for alternative pipeline validation if necessary
const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

// 🎯 GLOBAL SEED OPENGRAPH MATRIX
export const metadata: Metadata = {
  metadataBase: new URL("https://fjorr.com"),
  title: {
    default: "Fjorr",
    template: "%s | Fjorr", // Auto-stamps the brand title context onto your child static files!
  },
  description: "Short films of the world’s greatest stories.",
  keywords: ["cinematic films", "myth engine", "historical artifacts", "stories", "short films"],
  authors: [{ name: "Fjorr Team" }],
  creator: "Fjorr",
  
  // OpenGraph (Discord, Slack, LinkedIn, Facebook)
  openGraph: {
    title: "Fjorr",
    description: "Short films about the world’s greatest stories.",
    url: "https://fjorr.com",
    siteName: "Fjorr",
    type: "website",
    images: [
      {
        url: "/og-main-preview.jpg", // Placed in your /public root directory folder sheet
        width: 1200,
        height: 630,
        alt: "Fjorr Cinematic Myth Engine Preview Layout",
      },
    ],
  },

  // Twitter/X Card Layout Rules
  twitter: {
    card: "summary_large_image",
    title: "Fjorr",
    description: "Short films about the world’s greatest stories.",
    images: ["/og-main-preview.jpg"],
  },

  // Search indexing directive flags
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
  weight: ["300", "400", "500", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["300", "400", "500", "700", "800"],
});

const fontVariables = `${inter.variable} ${jetbrainsMono.variable}`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  console.log("--- ENV KEY DEBUGGER ---");
  console.log("All environment keys found:", Object.keys(process.env));
  console.log("--------------------------");

  const cookieStore = await cookies();
  const initialMode = parseDisplayMode(
    cookieStore.get(DISPLAY_MODE_COOKIE)?.value
  );

  return (
    <html lang="en" className={`${fontVariables} dark`}>
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/xyf8acw.css" />
      </head>
      <body className="font-sans antialiased text-light-01 min-h-screen">
        <DisplayModeProvider initialMode={initialMode}>
          {children}
        </DisplayModeProvider>
      </body>
    </html>
  );
}
