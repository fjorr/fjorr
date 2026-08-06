import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  // Weights used in UI (medium / semibold / bold / extrabold).
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

/** Avenir Next Variable (subset woff2) — display headlines via font-futura. */
const avenirNextVariable = localFont({
  src: "../public/fonts/AvenirNextVariable-Roman.woff2",
  weight: "250 900",
  style: "normal",
  variable: "--font-display",
  display: "swap",
});

export const fontVariables = `${inter.variable} ${interTight.variable} ${jetbrainsMono.variable} ${avenirNextVariable.variable}`;
