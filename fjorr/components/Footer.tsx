"use client";

import React from 'react';
import { Icon } from './ui/Icons';
import Link from 'next/link';
import { IntelForm } from './IntelForm';
// 🎯 PATH DETECTION ENGINE IMPORT
import { usePathname } from 'next/navigation';

interface FooterProps {
  variant?: 'light' | 'dark';
}

export default function Footer({ variant }: FooterProps) {
  // Read the active path coordinates automatically
  const pathname = usePathname();
  const isAboutPage = pathname === '/about';

  const isCustomVariant = variant === 'light' || variant === 'dark';

  // 🎯 THE CONTRAST ENGINE: Determine explicit text colors based on database settings or About page override
  // If we are on the about page, we want white text to pop cleanly off the black background
  const isDarkBg = variant === 'light' || isAboutPage; 
  
  const textColor = (isCustomVariant || isAboutPage) 
    ? (isDarkBg ? 'text-white' : 'text-black') 
    : 'text-black dark:text-white';
    
  const subTextColor = (isCustomVariant || isAboutPage) 
    ? (isDarkBg ? 'text-white/60' : 'text-black/60') 
    : 'text-black/40 dark:text-white/60';
    
  const mutedTextColor = (isCustomVariant || isAboutPage) 
    ? (isDarkBg ? 'text-white/40' : 'text-black/40') 
    : 'text-black/30 dark:text-white/40';

  // Compute the optimal structural background color layout classes dynamically
  const getBackgroundClass = () => {
    if (isAboutPage) return 'bg-black'; // ⚡ Strict override: lock to pure black on the about page layout sheet
    if (isCustomVariant) return 'bg-transparent';
    return 'bg-[#F5F5F7] dark:bg-[#1F1F1F]';
  };

  return (
    <footer 
      className={`
        w-full pt-16 pb-10 px-[10%] text-center flex flex-col items-center transition-colors duration-300
        ${getBackgroundClass()}
        ${textColor}
      `}
    >
      
      {/* 1. THE TOP BRAND ICON LAYER */}
      <div className="mb-6 transition-colors">
        <Link 
          href="/" 
          className={`w-6 h-6 mx-auto block hover:opacity-70 transition-opacity cursor-pointer ${textColor}`}
          aria-label="Go to homepage"
        >
          {/* 🎯 INLINED RAW CLEAN LOGO SVG */}
          <svg 
            viewBox="0 0 146 146" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <path 
              d="M124.53 103.73V113.76H105.63C103.42 113.76 101.63 111.97 101.63 109.76V60.37C101.63 58.16 103.42 56.37 105.63 56.37H136.2L136.14 103.72C136.14 103.72 124.37 103.74 124.54 103.74L124.53 103.73Z" 
              fill="currentColor"
            />
            <path 
              d="M141.18 44.49C143.61 44.49 145.59 42.52 145.59 40.08V4.63C145.59 2.07 143.52 0 140.96 0H45.12C20.2 0 0 20.2 0 45.12V140.96C0 143.52 2.07 145.59 4.63 145.59H140.95C143.51 145.59 145.58 143.52 145.58 140.96V130.15C145.58 127.66 143.56 125.64 141.07 125.64H105.62C96.85 125.64 89.74 118.53 89.74 109.76V60.37C89.74 51.6 96.85 44.49 105.62 44.49H141.18Z" 
              fill="currentColor"
            />
          </svg>
        </Link>
      </div>

      {/* 2. THE THREE NAVIGATION TRACKS (Trade Gothic) */}
      <div className="flex flex-col gap-0 mb-6 font-tradeGothic uppercase tracking-tight text-[16px] md:text-[16px] leading-tight">
        
        {/* ROW 1: COMPANY */}
        <div className="flex items-center justify-center gap-1 leading-tight">
          <span className={`${mutedTextColor} font-bold select-none transition-colors`}>Company</span>
          <Link href="/about" className={`${textColor} font-bold hover:opacity-70 transition-opacity`}>About</Link>
          <Link href="/contact" className={`${textColor} font-bold hover:opacity-70 transition-opacity`}>Contact</Link>
        </div>

        {/* ROW 2: PARTICIPATE */}
        <div className="flex items-center justify-center gap-1 leading-tight">
          <span className={`${mutedTextColor} font-bold select-none transition-colors`}>Participate</span>
          <Link href="/nominate" className={`${textColor} font-bold hover:opacity-70 transition-opacity`}>Nominate</Link>
          <Link href="/partner" className={`${textColor} font-bold hover:opacity-70 transition-opacity`}>Partner</Link>
        </div>

        {/* ROW 3: EXPLORE */}
        <div className="flex items-center justify-center gap-1 leading-tight">
          <span className={`${mutedTextColor} font-bold select-none transition-colors`}>Explore</span>
          <Link href="/" className={`${textColor} font-bold hover:opacity-70 transition-opacity`}>Films</Link>
        </div>

      </div>

      {/* 3. THE NEWSLETTER INPUT WRAPPER BLOCK */}
      <div className="w-full max-w-64 mb-6">
        {/* Pass down light/dark variant props safely, using light colors to force dark inputs if on about page */}
        <IntelForm 
          variant={isAboutPage ? 'light' : variant} 
          isCustomVariant={isCustomVariant || isAboutPage} 
        />
      </div>

      {/* 4. THE EDITORIAL PLATFORM EXPLAINER TEXT (Inter) */}
      <div className="max-w-2xl mb-2">
        <p className={`font-sans font-normal text-[12px] leading-[1.4em] tracking-normal transition-colors ${subTextColor}`}>
          Fjorr is home to short cinematic films about the world’s greatest <br className="hidden md:block" />
          stories. The stories are intended for cultural, educational, and creative <br className="hidden md:block" />
          purposes and may reflect artistic interpretation.
        </p>
      </div>

      {/* 5. THE UTILITY COMPLIANCE ACTIONS TRACK & THREE ICONS (Inter) */}
      <div className={`flex flex-col sm:flex-row items-center justify-center gap-2 mb-0 font-sans text-[12px] transition-colors ${subTextColor}`}>
        
        {/* The Trio Icon Asset Clusters */}
        <div className={`flex items-center gap-1 transition-colors ${mutedTextColor}`}>
          <Icon name="lock" className="w-4 h-4" />
          <Icon name="cc" className="w-4 h-4" />    
          <Icon name="globe" className="w-4 h-4" /> 
        </div>

        {/* Legal Action Links */}
        <div className="flex items-center gap-2">
          <Link href="/privacy" className={`hover:opacity-80 transition-colors ${subTextColor}`}>Privacy Policy</Link>
          <Link href="/terms" className={`hover:opacity-80 transition-colors ${subTextColor}`}>Terms of Use</Link>
        </div>

      </div>

      {/* 6. THE COPYRIGHT SIGNATURE MATRIX LINE (Inter) */}
      <div className="w-full pt-2">
        <p className={`font-sans text-[11px] tracking-wide transition-colors ${mutedTextColor}`}>
          © 2026 Fjorr. All rights reserved.
        </p>
      </div>

    </footer>
  );
}