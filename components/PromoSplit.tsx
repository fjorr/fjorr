'use client';

import React from 'react';
import { ContactPill } from '@/components/ui/contact-pill'; 

export default function PromoSplit() {
  return (
    /* 🌟 LOCKED LAYOUT PARAMETERS: Matches rails outer horizontal gutter parameters exactly */
    <section className="w-full pb-16 px-8 md:px-16">
      
      {/* 🌟 MAX-WIDTH WRAPPER: Ensures edge alignment constraints sit perfectly flush at all breakpoints */}
      <div className="w-full max-w-[1440px] mx-auto">
        
        {/* THE RESPONSIVE CORE: flex-col on mobile and tablet, lg:flex-row on desktop */}
        {/* 💥 FIXED: Added gap-12 on mobile to space the stacked boxes */}
        <div className="w-full flex flex-col lg:flex-row gap-12 lg:gap-4 items-stretch">
          
          {/* LEFT CONTAINER (The Text Overlay Frame) */}
          {/* 💥 FIXED: Changed aspect-[4/3] to aspect-auto and h-auto.
              Combined with the gap-12 on the parent flex container, this forces 
              the mobile box to vertically stretch based on its text content! */}
          <div className="w-full lg:w-1/2 aspect-auto lg:aspect-square h-auto lg:h-full bg-transparent relative drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center">
            {/* CLOUDFLARE ASSET: Left Dark Texture Backing */}
            {/* 💥 FIXED: Added 'hidden lg:block' so this dark backing image is completely 
                deleted on mobile and only appears on desktop. */}
            <img 
              src="https://media.fjorr.com/assets/fjorr-partner-promo-crowd-f1v04.avif" 
              alt="Partnerships Background"
              className="hidden lg:block absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity pointer-events-none rounded-[8px]"
            />
            
            {/* ABSOLUTE COPY OVERLAY CONTAINER */}
            {/* 💥 FIXED: Changed 'absolute inset-0 z-10' to 'relative z-10 flex flex-col' for fluid stacking */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center p-8 md:p-12 lg:p-12 rounded-[8px]">
              <span className="font-sans font-bold text-[11px] uppercase tracking-[0.25em] text-white/50 mb-4">
                Partnerships
              </span>
              
              <h2 className="font-futura font-extrabold uppercase tracking-[-0.05em] mb-4 max-w-3xl mx-auto text-center
                text-5xl leading-[0.75] 
                md:text-6xl md:leading-[0.75] 
                lg:text-6xl lg:leading-[0.75]"
              >
                {/* LINE 1 */}
                <span className="block mb-1">Make</span>
                
                {/* LINE 2 */}
                <span className="block">
                  &apos;em{' '}
                  {/* 💥 THE CHROMATIC STAGE
                      🎯 OPTICAL BALANCE: Reset margin to ml-1.5 so they look like naturally spaced adjacent words without colliding.
                  */}
                  <span data-text="feel." className="spiderverse-accurate-word relative inline-block ml-1.5">
                    feel.
                  </span>
                </span>
              </h2>
              
              <p className="font-sans font-medium text-base md:text-base leading-[1.5em] text-white/70 max-w-[350px] mb-6 tracking-normal">
                We work with brands, studios, and people who believe stories shape people and culture — and want to make work that does more than entertain.
              </p>
              
              {/* ANIMATION ENTRY BOX */}
              <div className="animate-in fade-in duration-700 ease-out fill-mode-forwards">
                <ContactPill />
              </div>
            </div>
          </div>

          {/* RIGHT CONTAINER (The Crowd Portrait Frame) */}
          <div className="w-full lg:w-1/2 aspect-[4/3] lg:aspect-square bg-transparent drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)]">
            {/* CLOUDFLARE ASSET: Right Portrait Photo */}
            <img 
              src="https://media.fjorr.com/assets/fjorr-partner-promo-crowd-f2v04.avif" 
              alt="Crowd Feeling Stories"
              className="w-full h-full object-cover filter grayscale rounded-[8px]"
              loading="lazy"
            />
          </div>

        </div>

      </div>

      {/* 💥 THE SPIDER-VERSE STYLING AND JITTER GLITCH ENGINE */}
      <style dangerouslySetInnerHTML={{ __html: `
        .spiderverse-accurate-word {
          color: #1F1F1F;
          -webkit-text-stroke: 1.5px rgba(255, 255, 255, 0.95);
          text-shadow: 
            3px 3px 0px #ff0055, 
            -3px -3px 0px #00f0ff;
          animation: spiderVibeCenter 2.5s steps(2) infinite alternate;
        }

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

        .spiderverse-accurate-word::before {
          color: transparent;
          -webkit-text-stroke: 1px #00f0ff;
          animation: glitchTrackCyan 1.8s steps(1) infinite;
          mix-blend-mode: screen;
          opacity: 0.85;
        }

        .spiderverse-accurate-word::after {
          color: transparent;
          -webkit-text-stroke: 1px #ff0055;
          animation: glitchTrackMagenta 1.4s steps(1) infinite;
          mix-blend-mode: screen;
          opacity: 0.85;
        }

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
    </section>
  );
}