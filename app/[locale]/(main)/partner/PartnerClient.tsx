'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ContactPill } from '@/components/ui/contact-pill';
import HouseScrollFooter from '@/components/HouseScrollFooter';

/**
 * Partner — white paper chrome; copy lives on the crowd image (old layout).
 */
export default function PartnerClient() {
  const t = useTranslations('Partner');

  return (
    <div className="flex min-h-screen w-full flex-col bg-white text-[#0B0B0C]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Partner with Fjorr',
            description: t('description'),
            provider: {
              '@type': 'Organization',
              name: 'Fjorr',
              url: 'https://www.fjorr.com',
            },
          }),
        }}
      />

      <div className="flex w-full flex-1 items-center justify-center px-6 pb-12 pt-10 font-sans select-none sm:px-10 md:px-16 md:pt-6">
        <div className="relative flex w-full max-w-[1240px] flex-col items-center justify-center">
          <picture className="pointer-events-none z-0 block h-auto w-full select-none opacity-0 animate-fade-in">
            <source
              media="(min-width: 768px)"
              srcSet="https://media.fjorr.com/app-assets/fjorr-partner-crowd-desktop-v05.avif"
            />
            <source
              media="(max-width: 767px)"
              srcSet="https://media.fjorr.com/app-assets/fjorr-partner-crowd-mobile-v05.avif"
            />
            <img
              src="https://media.fjorr.com/app-assets/fjorr-partner-crowd-mobile-v05.avif"
              className="mx-auto block h-auto w-full object-contain"
              alt={t('imageAlt')}
            />
          </picture>

          <div className="absolute inset-x-0 bottom-[32%] top-0 z-20 mt-6 flex flex-col items-center justify-center gap-3 px-12 text-center sm:mt-16 sm:px-20 md:bottom-[40%] md:mt-0 md:px-32">
            <h1
              className="mb-1.5 whitespace-pre-line font-futura text-6xl leading-[52px] tracking-tighter text-white opacity-0 animate-slide-up sm:text-7xl sm:leading-[64px] md:text-8xl md:leading-[76px]"
              style={{ animationDelay: '400ms' }}
            >
              {t('headlineLine1')}
              <br />
              {t('headlineLine2')}
            </h1>

            <p
              className="mb-4 max-w-[260px] font-inter text-base font-medium leading-relaxed text-white/70 opacity-0 animate-slide-up drop-shadow-xl sm:max-w-sm md:mb-6"
              style={{ animationDelay: '700ms' }}
            >
              {t('description')}
            </p>

            <div
              className="opacity-0 animate-slide-up"
              style={
                {
                  animationDelay: '950ms',
                  // Pill inverts off paper vars — white on the image, as before.
                  ['--page-fg' as string]: '#FFFFFF',
                  ['--page-bg' as string]: '#0B0B0C',
                } as React.CSSProperties
              }
            >
              <ContactPill />
            </div>
          </div>
        </div>
      </div>

      <HouseScrollFooter />

      <style
        dangerouslySetInnerHTML={{
          __html: `
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
      `,
        }}
      />
    </div>
  );
}
