'use client';

import React from 'react';
import { useDisplayMode } from '@/components/DisplayModeProvider';

/** Cinematic / Minimal switch — no label, centered under home search. */
export default function DisplayModeToggle() {
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
        Cinematic
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
        Minimal
      </button>
    </div>
  );
}
