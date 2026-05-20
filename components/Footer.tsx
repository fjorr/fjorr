"use client";

import React from 'react';
import { Icon } from './ui/Icons';
import Link from 'next/link';
// 🎯 1. IMPORT PLACEMENT: Pulling in the clean, modular component
import { IntelForm } from './IntelForm';

interface FooterProps {
  variant?: 'light' | 'dark';
}

export default function Footer({ variant }: FooterProps) {
  const isCustomVariant = variant === 'light' || variant === 'dark';

  // 🎯 THE CONTRAST ENGINE: Determine explicit text colors based on your database setting
  // If no variant is passed, fallback gracefully to your standard site styles
  const isDarkBg = variant === 'light'; // variant="light" means use white text for dark backgrounds
  
  const textColor = isCustomVariant 
    ? (isDarkBg ? 'text-white' : 'text-black') 
    : 'text-black dark:text-white';
    
  const subTextColor = isCustomVariant 
    ? (isDarkBg ? 'text-white/60' : 'text-black/60') 
    : 'text-black/40 dark:text-white/60';
    
  const mutedTextColor = isCustomVariant 
    ? (isDarkBg ? 'text-white/40' : 'text-black/40') 
    : 'text-black/30 dark:text-white/40';

  return (
    <footer 
      className={`
        w-full pt-16 pb-10 px-[10%] text-center flex flex-col items-center transition-colors duration-300
        ${isCustomVariant ? 'bg-transparent' : 'bg-[#F5F5F7] dark:bg-[#1F1F1F]'}
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
          <Icon name="logo" className="w-full h-full" />
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
        {/* 🎯 2. COMPONENT PLACEMENT: Replaced the old manual form setup entirely */}
        <IntelForm variant={variant} isCustomVariant={isCustomVariant} />
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