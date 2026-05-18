"use client";

import React from 'react';
import { Icon } from './ui/Icons';
import Link from 'next/link';

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
        w-full pt-16 pb-16 px-[10%] text-center flex flex-col items-center transition-colors duration-300
        ${isCustomVariant ? 'bg-transparent' : 'bg-[#F5F5F7] dark:bg-[#1D1D1F]'}
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
        <form onSubmit={(e) => e.preventDefault()} className="w-full relative group">
          <input 
            type="email" 
            placeholder="Email" 
            className={`w-full rounded-[8px] h-12 pl-5 pr-12 font-sans font-semibold text-[14px] focus:outline-none transition-all duration-200
              ${isCustomVariant 
                ? `${textColor} focus:border-current/30 ${
                    variant === 'light'
                      ? 'bg-white/10 placeholder-white/40 border border-white/10' 
                      : 'bg-black/5 placeholder-black/40 border border-black/10'
                  }` 
                : 'bg-black/5 dark:bg-white/5 text-black dark:text-white placeholder-black/40 dark:placeholder-white/60 focus:border-black/20 dark:focus:border-white/20'
              }
            `}
          />
          
          <button 
            type="submit" 
            className={`absolute right-4 top-1/2 -translate-y-1/2 hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 flex items-center justify-center ${subTextColor}`}
            aria-label="Subscribe to newsletter"
          >
            <svg className="w-5 h-5" viewBox="0 0 640 640" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M569 337C578.4 327.6 578.4 312.4 569 303.1L401 135C391.6 125.6 376.4 125.6 367.1 135C357.8 144.4 357.7 159.6 367.1 168.9L494.1 295.9L88 295.9C74.7 295.9 64 306.6 64 319.9C64 333.2 74.7 343.9 88 343.9L494.1 343.9L367.1 470.9C357.7 480.3 357.7 495.5 367.1 504.8C376.5 514.1 391.7 514.2 401 504.8L569 337z" />
            </svg>
          </button>
        </form>
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