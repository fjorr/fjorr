'use client';

import React from 'react';

interface SuccessProps {
  onReset: () => void;
}

export default function NominateSuccessView({ onReset }: SuccessProps) {
  return (
    /* 🎯 UNIFIED MASTER EXTERIOR VIEWPORT CARRIER 
       - Removed aspect ratios entirely. Spans full available width up to max-w-md with natural height.
    */
    <div className="w-full max-w-md mx-auto h-auto bg-transparent flex items-center justify-center transition-all duration-500">
      
      {/* 1. MASTER EXTERIOR CONTAINER FRAME WITH A 10% WHITE BORDER */}
      <div className="w-full h-full border border-[#FFFFFF]/10 rounded-2xl bg-[#1F1F1F] flex items-center justify-center overflow-hidden relative group">
        
        {/* 2. SOLID INTERIOR CANVAS FRAME LAYER
            🎯 FIXED: Enforced a consistent, unconstrained py-16 layout across all viewports 
            to let the text breathe effortlessly away from the borders.
        */}
        <div className="w-full h-full bg-[#1F1F1F] px-[30px] py-16 relative flex flex-col items-center justify-center text-center">
          
          {/* 3. CLAMPED INDENTED DOT MATRIX CANVAS LAYER (30px offset padding margins) */}
          <div 
            className="absolute top-[30px] bottom-[30px] left-[30px] right-[30px] opacity-[0.15] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#FFFFFF 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              backgroundPosition: 'center',
            }}
          />

          {/* =========================================================================
              INTERFACE FOREGROUND CONTENT DECK
              ========================================================================= */}
          <div 
            className="relative z-10 flex flex-col items-center justify-center opacity-0 animate-slide-up"
            style={{ animationDelay: '150ms' }}
          >
            
            {/* ICON SPEC INSTANCE */}
            <div className="mb-4 text-white/90">
              <svg className="w-10 h-10 stroke-current" fill="none" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>

            {/* TYPOGRAPHY HEADINGS HEADER */}
            <h2 className="text-5xl sm:text-6xl font-extrabold uppercase tracking-tighter text-light-01 leading-[46px] sm:leading-[54px] font-futura mb-4 select-none">
              Logged.
            </h2>

            {/* SUMMARY PLATFORM PARAGRAPH BLOCKS */}
            <p className="font-sans font-medium text-base leading-relaxed text-white/60 max-w-[200px] sm:max-w-[250px] mb-8 tracking-tight">
              Thank you for sending this story our way. We’ll review it with care. If it feels like a fit, we’ll be in touch.
            </p>

            {/* RESET ACTION CTA CONTROL */}
            <button
              onClick={onReset}
              className="px-10 h-14 bg-white text-black font-sans font-bold text-[15px] tracking-tight rounded-full hover:bg-white/90 active:scale-95 transition-all duration-150 inline-flex items-center justify-center gap-1.5 group/btn"
            >
              <span>Submit more</span>
              <svg className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>

          </div>

        </div>
      </div>
      
    </div>
  );
}