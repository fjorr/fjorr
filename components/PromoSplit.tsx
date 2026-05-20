import React from 'react';

export default function PromoSplit() {
  return (
    /* 🌟 LOCKED LAYOUT PARAMETERS: Matches rails outer horizontal gutter parameters exactly */
    <section className="w-full pb-16 px-8 md:px-16">
      
      {/* 🌟 MAX-WIDTH WRAPPER: Ensures edge alignment constraints sit perfectly flush at all breakpoints */}
      <div className="w-full max-w-[1440px] mx-auto">
        
        {/* THE RESPONSIVE CORE: flex-col on mobile, md:flex-row on desktop */}
        <div className="w-full flex flex-col md:flex-row gap-4 items-stretch">
          
          {/* LEFT CONTAINER (The Text Overlay Frame) 
              🎯 FIXED: Added tight, subtle drop shadow. Removed overflow-hidden so the shadow doesn't clip.
          */}
          <div className="w-full md:w-1/2 aspect-[4/3] md:aspect-square bg-transparent relative drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)]">
            {/* CLOUDFLARE ASSET: Left Dark Texture Backing */}
            <img 
              src="https://media.fjorr.com/assets/fjorr-partner-promo-crowd-f1v04.avif" 
              alt="Partnerships Background"
              /* 🎯 ROUNDING FIX: Moved rounded-[8px] here so the image corners stay masked */
              className="w-full h-full object-cover opacity-40 mix-blend-luminosity pointer-events-none rounded-[8px]"
            />
            
            {/* ABSOLUTE COPY OVERLAY CONTAINER */}
            {/* 🎯 ROUNDING FIX: Added rounded-[8px] here as well so the overlay boundaries fit perfectly */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-[8px]">
              <span className="font-sans font-bold text-[11px] uppercase tracking-[0.25em] text-white/50 mb-4">
                Partnerships
              </span>
              
              <h2 className="font-futura font-extrabold text-[50px] md:text-[50px] lg:text-[60px] uppercase tracking-[-0.05em] leading-[0.85] mb-4 max-w-3xl mx-auto block">
                Make {' '}
                <span className="block">'Em Feel.</span>
              </h2>   
              
              <p className="font-sans font-normal text-[14px] md:text-[15px] leading-[1.5em] text-white/70 max-w-xsm mb-6 tracking-tight">
                We work with brands, studios, and people who believe stories shape people.
              </p>
              
              <a 
                href="#learn-more" 
                className="font-sans font-medium text-[14px] text-white/90 hover:text-white flex items-center gap-1.5 group/link transition-colors duration-200"
              >
                Learn more 
                <span className="transform transition-transform duration-200 group-hover/link:translate-x-1">→</span>
              </a>
            </div>
          </div>

          {/* RIGHT CONTAINER (The Crowd Portrait Frame)
              🎯 FIXED: Added tight, subtle drop shadow. Removed overflow-hidden to let shadow show.
          */}
          <div className="w-full md:w-1/2 aspect-[4/3] md:aspect-square bg-transparent drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)]">
            {/* CLOUDFLARE ASSET: Right Portrait Photo */}
            <img 
              src="https://media.fjorr.com/assets/fjorr-partner-promo-crowd-f2v04.avif" 
              alt="Crowd Feeling Stories"
              /* 🎯 ROUNDING FIX: Kept corners perfectly masked on the image asset itself */
              className="w-full h-full object-cover filter grayscale rounded-[8px]"
              loading="lazy"
            />
          </div>

        </div>

      </div>
    </section>
  );
}