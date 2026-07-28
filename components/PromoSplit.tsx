'use client';

import React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ContactPill } from '@/components/ui/contact-pill'; 

export default function PromoSplit() {
  const t = useTranslations('Partner');
  return (
    /* 🌟 LOCKED LAYOUT PARAMETERS: Matches rails outer horizontal gutter parameters exactly */
    <section className="w-full pb-16 px-8 md:px-16">
      
      {/* 🌟 MAX-WIDTH WRAPPER: Ensures edge alignment constraints sit perfectly flush at all breakpoints */}
      <div className="w-full max-w-[1440px] mx-auto">
        
        {/* THE RESPONSIVE CORE: flex-col on mobile and tablet, lg:flex-row on desktop */}
        {/* 💥 FIXED: Added gap-12 on mobile to space the stacked boxes */}
        <div className="w-full flex flex-col lg:flex-row gap-0 items-stretch">
          
          {/* LEFT: image defines the frame; copy overlays inside with fluid type so it stays in-bounds */}
          <div className="w-full lg:w-1/2 relative rounded-[8px] overflow-hidden dark:drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)] lg:aspect-square lg:flex lg:items-center lg:justify-center">
            <Image
              src="https://media.fjorr.com/assets/fjorr-partner-promo-crowd-f1v04.avif"
              alt={t('bgAlt')}
              width={1600}
              height={1600}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="w-full h-auto lg:absolute lg:inset-0 lg:h-full lg:w-full object-contain opacity-100 dark:opacity-40 mix-blend-luminosity rounded-[8px] pointer-events-none"
            />

            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-[12%] py-[10%] sm:px-[14%] sm:py-[12%] lg:px-[12%] lg:py-[10%]">
              <span className="font-sans font-bold text-[clamp(9px,2.8vw,11px)] uppercase tracking-[0.25em] text-white/50 mb-[0.6em]">
                {t('eyebrow')}
              </span>

              <h2 className="font-futura font-extrabold uppercase tracking-[-0.05em] mb-[0.45em] w-full max-w-full text-center text-white text-[clamp(1.65rem,9.5vw,3.75rem)] leading-[0.78]">
                <span className="block mb-[0.12em]">{t('headlineLine1')}</span>
                <span className="block">
                  &apos;em {t('headlineFeel')}
                </span>
              </h2>

              <p className="font-sans font-medium text-[clamp(0.78rem,3.2vw,1rem)] leading-[1.45] text-white/70 w-full max-w-[min(22rem,100%)] mb-[1.1em] tracking-normal">
                {t('promoBody')}
              </p>

              <div className="animate-in fade-in duration-700 ease-out fill-mode-forwards w-full max-w-full flex justify-center">
                <ContactPill className="!min-w-0 max-w-full" />
              </div>
            </div>
          </div>

          {/* RIGHT CONTAINER (The Crowd Portrait Frame) — object-contain so faces aren’t cropped */}
          <div className="w-full lg:w-1/2 relative rounded-[8px] overflow-hidden dark:drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)] lg:aspect-square lg:flex lg:items-center lg:justify-center">
            <Image
              src="https://media.fjorr.com/assets/fjorr-partner-promo-crowd-f2v04.avif"
              alt={t('crowdAlt')}
              width={1600}
              height={1600}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="w-full h-auto lg:h-full lg:w-full object-contain filter grayscale rounded-[8px]"
            />
          </div>

        </div>

      </div>
    </section>
  );
}