import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Core Google Fonts routed through root variables
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        
        // 🎯 ADOBE FONTS DESIGN TOKENS DEFINED RIGHT HERE:
        // Note: The double quotes nested inside the single quotes are required 
        // to prevent the browser from misinterpreting hyphens in font names.
        futura: ['"futura-pt-condensed"', "sans-serif"],
        tradeGothic: ['"trade-gothic-next-compressed"', "sans-serif"],
      },
      colors: {
        dark: {
          "01": "var(--dark-01)",
          "02": "var(--dark-02)",
          "03": "var(--dark-03)",
          "04": "var(--dark-04)",
        },
        light: {
          "01": "var(--light-01)",
          "02": "var(--light-02)",
          "03": "var(--light-03)",
          "04": "var(--light-04)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;