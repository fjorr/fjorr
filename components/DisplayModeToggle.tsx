'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useDisplayMode } from '@/components/DisplayModeProvider';
import type { DisplayMode } from '@/lib/display-mode';

function ModeIcon({ mode }: { mode: DisplayMode }) {
  if (mode === 'cinematic') {
    // Poster grid
    return (
      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor" aria-hidden>
        <rect x="1" y="1" width="6" height="6" rx="1" />
        <rect x="9" y="1" width="6" height="6" rx="1" />
        <rect x="1" y="9" width="6" height="6" rx="1" />
        <rect x="9" y="9" width="6" height="6" rx="1" />
      </svg>
    );
  }

  if (mode === 'minimal') {
    // List rows
    return (
      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor" aria-hidden>
        <rect x="1" y="2.5" width="14" height="2" rx="1" />
        <rect x="1" y="7" width="14" height="2" rx="1" />
        <rect x="1" y="11.5" width="14" height="2" rx="1" />
      </svg>
    );
  }

  // Stopwatch — Time mode
  return (
    <svg
      viewBox="0 0 16 16"
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="8" cy="9" r="5.25" />
      <path d="M8 9V6.5" />
      <path d="M6.5 2.5h3" />
      <path d="M8 2.5V4" />
    </svg>
  );
}

/** Compact icon switch for Cine / Mini / Time. */
export default function DisplayModeToggle() {
  const t = useTranslations('DisplayMode');
  const { mode, setMode } = useDisplayMode();

  const options: { id: DisplayMode; label: string }[] = [
    { id: 'cinematic', label: t('cinematicFull') },
    { id: 'minimal', label: t('minimalFull') },
    { id: 'timeline', label: t('timelineFull') },
  ];

  return (
    <div className="inline-flex shrink-0 items-center gap-0.5 rounded-[8px] p-0.5 bg-white/5">
      {options.map((option) => {
        const active = mode === option.id;
        return (
          <button
            key={option.id}
            type="button"
            title={option.label}
            aria-label={option.label}
            aria-pressed={active}
            onClick={() => setMode(option.id)}
            className={`w-7 h-7 sm:w-8 sm:h-8 inline-flex items-center justify-center rounded-[6px] transition-colors ${
              active
                ? 'bg-white/15 text-white'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <ModeIcon mode={option.id} />
          </button>
        );
      })}
    </div>
  );
}
