'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useDisplayMode } from '@/components/DisplayModeProvider';

/** Cinematic / Minimal switch — no label, centered under home search. */
export default function DisplayModeToggle() {
  const t = useTranslations('DisplayMode');
  const { mode, setMode } = useDisplayMode();

  return (
    <div className="inline-flex items-center gap-1 rounded-[8px] p-0.5 bg-white/5">
      <button
        type="button"
        onClick={() => setMode('cinematic')}
        className={`font-sans text-xs font-semibold px-3 py-1.5 rounded-[6px] transition-colors ${
          mode === 'cinematic'
            ? 'bg-white/15 text-white'
            : 'text-white/40 hover:text-white/70'
        }`}
      >
        {t('cinematic')}
      </button>
      <button
        type="button"
        onClick={() => setMode('minimal')}
        className={`font-sans text-xs font-semibold px-3 py-1.5 rounded-[6px] transition-colors ${
          mode === 'minimal'
            ? 'bg-white/15 text-white'
            : 'text-white/40 hover:text-white/70'
        }`}
      >
        {t('minimal')}
      </button>
    </div>
  );
}
