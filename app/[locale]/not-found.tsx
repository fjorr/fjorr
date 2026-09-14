'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import Navbar from '@/components/Navbar';
import HouseScrollFooter from '@/components/HouseScrollFooter';
import { useHouseOverlay } from '@/components/HouseOverlayProvider';

export default function NotFound() {
  const t = useTranslations('NotFound');
  const { open } = useHouseOverlay();

  return (
    <div className="flex min-h-dvh flex-col bg-white text-[#0B0B0C]">
      {/* Fixed so centered content can’t paint over chrome. */}
      <div className="fixed inset-x-0 top-0 z-[60]">
        <Navbar variant="dark" />
      </div>
      <main className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 pb-8 pt-[56px]">
        <h1 className="m-0 text-center font-interTight text-[40px] font-bold leading-none tracking-tight text-[#0B0B0C] sm:text-[52px] md:text-[64px]">
          {t('title')}
        </h1>
        <button
          type="button"
          onClick={() => open('search')}
          className="mt-8 inline-flex h-10 items-center gap-2 border-0 bg-transparent p-0 font-sans text-[14px] font-semibold tracking-tight text-[#0B0B0C] transition-opacity hover:opacity-70"
        >
          <span>{t('search')}</span>
          <kbd className="font-sans text-[12px] font-semibold tracking-tight text-black/35">
            ⌘K
          </kbd>
        </button>
      </main>
      <HouseScrollFooter />
    </div>
  );
}
