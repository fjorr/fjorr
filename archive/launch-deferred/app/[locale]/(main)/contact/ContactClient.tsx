'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import HouseScrollFooter from '@/components/HouseScrollFooter';

const DESK_EMAIL = 'control@fjorr.com';

/**
 * Contact — quiet paper page; one door to the desk.
 */
export default function ContactClient() {
  const t = useTranslations('Contact');

  return (
    <div className="flex min-h-screen w-full flex-col bg-white text-[#0B0B0C]">
      <div className="flex w-full flex-1 flex-col items-center justify-center px-6 pb-16 pt-14 text-center md:px-10 md:pt-16">
        <h1 className="max-w-[20ch] font-interTight text-[clamp(2.5rem,7vw,4rem)] font-bold leading-[0.92] tracking-tight text-balance">
          {t('headline')}
        </h1>
        <p className="mt-5 max-w-md font-interTight text-[21px] font-semibold leading-normal tracking-tight text-black/60 text-balance">
          {t('lead')}
        </p>
        <a
          href={`mailto:${DESK_EMAIL}`}
          className="mt-10 inline-flex h-11 items-center rounded-full bg-[#0B0B0C] px-6 font-sans text-[14px] font-semibold tracking-tight text-white transition-opacity hover:opacity-90"
        >
          {t('cta')}
        </a>
        <p className="mt-4 font-sans text-[13px] font-medium text-black/35">
          {DESK_EMAIL}
        </p>
      </div>
      <HouseScrollFooter />
    </div>
  );
}
