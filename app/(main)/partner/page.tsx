'use client';

import React from 'react';
import { ContactPill } from '@/components/ui/contact-pill';

export default function PartnerPage() {
  return (
    /* 🎯 UNIFIED CANVAS WORKSPACE */
    <div className="w-full min-h-[calc(100vh-160px)] md:min-h-[calc(100vh-500px)] bg-[#1F1F1F] text-[#F5F5F7] flex items-center justify-center font-sans select-none pt-2 pb-12">
      
      {/* 🎬 SEAMLESS SLIDE ANCHOR FIELD */}
      <div className="w-full max-w-[1240px] px-6 sm:px-10 md:px-16 relative flex flex-col items-center justify-center">
        
        {/* --- THE PICTURE SYSTEM --- 
            🎯 FIXED: Tightened the shadow reach (25px blur instead of 60px) and 
               lowered opacity to 0.45 for a premium, clean, completely subtle anchor lift.
        */}
        <picture className="w-full h-auto select-none pointer-events-none z-0 block opacity-0 animate-fade-in drop-shadow-[0_15px_25px_rgba(0,0,0,0.45)]">
          <source 
            media="(min-width: 768px)" 
            srcSet="https://media.fjorr.com/assets/fjorr-partner-crowd-desktop-v05.avif" 
          />
          <source 
            media="(max-width: 767px)" 
            srcSet="https://media.fjorr.com/assets/fjorr-partner-crowd-mobile-v05.avif" 
          />
          <img 
            src="https://media.fjorr.com/assets/fjorr-partner-crowd-mobile-v05.avif" 
            className="w-full h-auto object-contain block mx-auto"
            alt="Fjorr Partnerships Slide"
          />
        </picture>

        {/* --- THE TYPOGRAPHY CONTENT DECK OVERLAY --- */}
        <div className="absolute inset-x-0 top-0 bottom-[32%] md:bottom-[40%] flex flex-col items-center justify-center text-center gap-3 md:gap-4 z-20 px-12 sm:px-20 md:px-32 mt-6 sm:mt-16 md:mt-0">
          
          {/* 🎬 STEP 2: THE REVEALING HEADLINE */}
          <h1 
            className="text-6xl sm:text-7xl md:text-8xl font-extrabold uppercase tracking-tighter text-white leading-[0.85] font-futura mb-0.5 opacity-0 animate-slide-up whitespace-nowrap"
            style={{ animationDelay: '400ms' }}
          >
            <span>Make &apos;Em </span>
            <span className="text-transparent bg-clip-text bg-[length:300%_auto] bg-gradient-to-r from-[#FF7A00] via-[#FF007A] via-[#7A00FF] via-[#0047FF] via-[#00E5FF] to-[#FF7A00] animate-ai-spectrum">
              Feel.
            </span>
          </h1>
          
          {/* 🎬 STEP 3: EDITORIAL DECK BLURB */}
          <p 
            className="text-base font-medium font-inter text-zinc-200 max-w-xs md:max-w-md leading-relaxed mb-4 md:mb-6 drop-shadow-xl opacity-0 animate-slide-up"
            style={{ animationDelay: '700ms' }}
          >
            We work with brands, studios, and individuals who believe stories shape people. From original films to cultural partnerships, we collaborate to bring meaningful ideas to life. If you&apos;re interested in building something worth making, reach out.
          </p>

          {/* 🎬 STEP 4: DYNAMIC CLIPBOARD INTERACTION PILL */}
          <div
            className="opacity-0 animate-slide-up"
            style={{ animationDelay: '950ms' }}
          >
            <ContactPill />
          </div>
          
        </div>

      </div>

      {/* CINEMATIC TIMING ENGINE */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes sceneReveal {
          to { opacity: 1; }
        }

        @keyframes layoutSlideUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spectrumTrack {
          0% { background-position: 0% center; }
          50% { background-position: 100% center; }
          100% { background-position: 0% center; }
        }
        
        .animate-fade-in {
          animation: sceneReveal 1000ms cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        .animate-slide-up {
          animation: layoutSlideUp 850ms cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        .animate-ai-spectrum {
          animation: spectrumTrack 6s ease-in-out infinite;
        }
      `}} />
    </div>
  );
}