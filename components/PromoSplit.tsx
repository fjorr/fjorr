import React from 'react';

export default function PromoSplit() {
  return (
    <section className="w-full px-[10%] pb-16">
      {/* THE RESPONSIVE CORE: flex-col on mobile, md:flex-row on desktop */}
      <div className="w-full flex flex-col md:flex-row gap-4 items-stretch">
        
        {/* LEFT CONTAINER (The Text Overlay Frame) */}
        <div className="w-full md:w-1/2 aspect-[4/3] md:aspect-square rounded-[8px] bg-transparent overflow-hidden relative">
          {/* 🎯 CLOUDFLARE ASSET: Left Dark Texture Backing */}
          <img 
            src="https://media.fjorr.com/assets/fjorr-partner-promo-crowd-f1v04.avif" 
            alt="Partnerships Background"
            className="w-full h-full object-cover opacity-40 mix-blend-luminosity pointer-events-none"
          />
          
          {/* ABSOLUTE COPY OVERLAY CONTAINER */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-8 md:p-12">
            <span className="font-sans font-bold text-[11px] uppercase tracking-[0.25em] text-white/50 mb-4">
              Partnerships
            </span>
            
            {/* 🎯 PROMOSPLIT NATIVE UPGRADE: Swapped inline styles for font-futura and font-extrabold */}
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

        {/* RIGHT CONTAINER (The Crowd Portrait Frame) */}
        <div className="w-full md:w-1/2 aspect-[4/3] md:aspect-square rounded-[8px] overflow-hidden bg-transparent">
          {/* 🎯 CLOUDFLARE ASSET: Right Portrait Photo */}
          <img 
            src="https://media.fjorr.com/assets/fjorr-partner-promo-crowd-f2v04.avif" 
            alt="Crowd Feeling Stories"
            className="w-full h-full object-cover filter grayscale"
            loading="lazy"
          />
        </div>

      </div>
    </section>
  );
}