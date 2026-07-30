import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  // Match Tailwind weights used across UI (medium/semibold/bold/extrabold/black).
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

/** Tighter Inter — available for body/UI or headlines via font-interTight. */
const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "700"],
  display: "swap",
});

/** Avenir Next Variable — wght 250–900, wdth 75–100. */
const avenirNextVariable = localFont({
  src: "../public/fonts/AvenirNextVariable-Roman.ttf",
  weight: "250 900",
  style: "normal",
  variable: "--font-display",
  display: "swap",
});

export const fontVariables = `${inter.variable} ${interTight.variable} ${jetbrainsMono.variable} ${avenirNextVariable.variable}`;
