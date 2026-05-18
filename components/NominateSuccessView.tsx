'use client';

import React from 'react';

interface SuccessProps {
  onReset: () => void;
}

export default function NominateSuccessView({ onReset }: SuccessProps) {
  return (
    <div className="w-full max-w-md mx-auto aspect-[1/1] sm:aspect-[4/3.5] bg-gradient-to-b from-zinc-900/40 to-zinc-950/60 rounded-2xl border border-white/5 relative p-8 flex flex-col items-center justify-center text-center shadow-2xl transition-all duration-500 overflow-hidden group">
      
      {/* THE GLOW RADIAL AMBIENT BACKGROUND LAYER */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-indigo-500/10 to-transparent opacity-60 pointer-events-none" />

      {/* ICON SPEC INSTANCE */}
      <div className="mb-4 text-white/90 animate-pulse">
        <svg className="w-10 h-10 stroke-current" fill="none" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      </div>

      {/* TYPOGRAPHY HEADINGS HEADER (Trade Gothic Scale) */}
      <h2 className="font-tradeGothic text-[44px] sm:text-[54px] font-black uppercase tracking-tight leading-none text-white mb-4 select-none">
        Told.
      </h2>

      <p className="font-sans font-medium text-[14px] leading-relaxed text-white/50 max-w-xs mb-8 tracking-tight">
        Thank you for the nomination. Now, we review. If the story is a fit, we'll be in touch.
      </p>

      {/* RESET ACTION COMPONENT HUB */}
      <button
        onClick={onReset}
        className="px-8 h-11 inline-flex items-center justify-center gap-1.5 font-sans font-bold text-[13px] tracking-tight bg-white text-black hover:bg-white/90 rounded-full transition-all shadow-xl active:scale-95 duration-150 group/btn"
      >
        <span>Go again</span>
        <svg className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </button>

    </div>
  );
}