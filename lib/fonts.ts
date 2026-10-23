import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

/** Tighter Inter — headlines/UI via font-interTight. */
const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  weight: ["600", "700", "800"],
  display: "swap",
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
  preload: false,
});

/** CircularXX Web Bold — licensed for fjorr.com. About sentences. */
const circularXXBold = localFont({
  src: "../public/fonts/CircularXXWeb-Bold.woff2",
  weight: "700",
  style: "normal",
  variable: "--font-circular",
  display: "swap",
  preload: false,
});

/** CircularXX Web Black — licensed for fjorr.com. Headlines. */
const circularXXBlack = localFont({
  src: "../public/fonts/CircularXXWeb-Black.woff2",
  weight: "900",
  style: "normal",
  variable: "--font-circular-black",
  display: "swap",
  preload: true,
});

export const fontVariables = `${inter.variable} ${interTight.variable} ${jetbrainsMono.variable} ${circularXXBold.variable} ${circularXXBlack.variable}`;
