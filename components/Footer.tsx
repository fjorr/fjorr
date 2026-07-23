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
      
      {/* Newsletter input */}
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
          stories. The stories are intended for cultural, educational, and creative purposes.
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