'use client';

import React from 'react';
import { ContactPill } from '@/components/ui/contact-pill';

export default function PartnerClient() {
  return (
    /* 🎯 UNIFIED CANVAS WORKSPACE */
    <div className="w-full min-h-[calc(100vh-160px)] md:min-h-[calc(100vh-500px)] bg-[#1F1F1F] text-[#F5F5F7] flex items-center justify-center font-sans select-none pb-12">
      
{/* 🧠 STRUCTURED DATA: AI Partnership Optimization */}
<script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Partner with Fjorr",
            "description": "Collaborate with Fjorr. We work with brands, studios, and individuals who believe stories shape people to bring meaningful ideas to life.",
            "provider": {
              "@type": "Organization",
              "name": "Fjorr",
              "url": "https://fjorr.com"
            }
          })
        }}
      />

      {/* 🎬 SEAMLESS SLIDE ANCHOR FIELD */}
      <div className="w-full max-w-[1240px] px-6 sm:px-10 md:px-16 relative flex flex-col items-center justify-center">
        
        {/* --- THE PICTURE SYSTEM --- */}
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
        <div className="absolute inset-x-0 top-0 bottom-[32%] md:bottom-[40%] flex flex-col items-center justify-center text-center gap-3 md:gap-3 z-20 px-12 sm:px-20 md:px-32 mt-6 sm:mt-16 md:mt-0">
          
          {/* 🎬 STEP 2: THE REVEALING HEADLINE 
              🛠️ SPIDER-VERSE LOGO WRAPPER INJECTION:
              - Isolated 'Feel.' into a dedicated inline-block span class wrapper.
              - Injected the attribute data-text="Feel." onto the wrapper node to generate structural mirroring.
          */}
          <h1 
            className="text-6xl sm:text-7xl md:text-8xl font-extrabold uppercase tracking-tighter text-light-01 leading-[52px] sm:leading-[64px] md:leading-[76px] font-futura mb-1.5 opacity-0 animate-slide-up whitespace-pre-line"
            style={{ animationDelay: '400ms' }}
          >
            Make <br />
            &apos;Em <span data-text="Feel." className="spiderverse-accurate-word relative inline-block">Feel.</span>
          </h1>
          
          {/* 🎬 STEP 3: EDITORIAL DECK BLURB */}
          <p 
            className="text-base font-medium font-inter text-light-02 max-w-[260px] sm:max-w-sm leading-relaxed mb-4 md:mb-6 drop-shadow-xl opacity-0 animate-slide-up"
            style={{ animationDelay: '700ms' }}
          >
            We work with brands, studios, and individuals who believe stories shape people. From original films to cultural partnerships, we collaborate to bring meaningful ideas to life.
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

      {/* CINEMATIC TIMING & COMIC TEXT EFFECTS ENGINE */}
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
        
        .animate-fade-in {
          animation: sceneReveal 1000ms cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        .animate-slide-up {
          animation: layoutSlideUp 850ms cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        /* =========================================================================
           💥 SPIDER-VERSE CHROMATIC MULTI-LAYER STROKE GLITCH SYSTEM
           ========================================================================= */
        .spiderverse-accurate-word {
          /* Subdues the dominant white fill by using a dark, layered color layout */
          color: #1F1F1F;
          -webkit-text-stroke: 1.5px rgba(255, 255, 255, 0.95);
          text-shadow: 
            3px 3px 0px #ff0055, 
            -3px -3px 0px #00f0ff;
          animation: spiderVibeCenter 2.5s steps(2) infinite alternate;
        }

        /* Generated Pseudo Layer Duplicates */
        .spiderverse-accurate-word::before,
        .spiderverse-accurate-word::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
        }

        /* 🔵 Layer 1: High-Frequency Cyan Offset Shift */
        .spiderverse-accurate-word::before {
          color: transparent;
          -webkit-text-stroke: 1px #00f0ff;
          animation: glitchTrackCyan 1.8s steps(1) infinite;
          mix-blend-mode: screen;
          opacity: 0.85;
        }

        /* 🔴 Layer 2: High-Frequency Magenta Offset Shift */
        .spiderverse-accurate-word::after {
          color: transparent;
          -webkit-text-stroke: 1px #ff0055;
          animation: glitchTrackMagenta 1.4s steps(1) infinite;
          mix-blend-mode: screen;
          opacity: 0.85;
        }

        /* 🎬 Jitter & Skew Animation Sequences mimicking real film print alignment slips */
        @keyframes spiderVibeCenter {
          0% { text-shadow: 2px 2px 0px #ff0055, -2px -2px 0px #00f0ff; transform: rotate(0.5deg); }
          50% { text-shadow: -1px 3px 0px #ff0055, 2px -1px 0px #00f0ff; transform: rotate(-0.5deg) skewX(1deg); }
          100% { text-shadow: 3px -1px 0px #ff0055, -3px 2px 0px #00f0ff; transform: rotate(0.2deg); }
        }

        @keyframes glitchTrackCyan {
          0%, 90%, 100% { transform: translate(0, 0); clip-path: inset(0 0 0 0); }
          20% { transform: translate(-3px, 2px); clip-path: inset(20% 0 40% 0); }
          40% { transform: translate(2px, -2px); clip-path: inset(60% 0 10% 0); }
          60% { transform: translate(-1px, 3px); clip-path: inset(10% 0 75% 0); }
        }

        @keyframes glitchTrackMagenta {
          0%, 85%, 100% { transform: translate(0, 0); clip-path: inset(0 0 0 0); }
          15% { transform: translate(3px, -2px); clip-path: inset(45% 0 15% 0); }
          35% { transform: translate(-2px, 1px); clip-path: inset(5% 0 80% 0); }
          55% { transform: translate(2px, -3px); clip-path: inset(70% 0 5% 0); }
        }
      `}} />
    </div>
  );
}