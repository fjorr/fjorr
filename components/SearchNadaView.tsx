'use client';

import React from 'react';
import Link from 'next/link';

export default function SearchNadaView() {
  return (
    <div className="w-full py-6 flex flex-col items-center justify-center text-center max-w-xl animate-in fade-in duration-500">
      
      {/* 🎯 UPDATED COLOR SHIFT SCALE KEYFRAMES */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes popCircleStroke {
          0% {
            transform: scale(0);
            border-color: #EF4444; /* Start vibrant red */
            opacity: 0;
          }
          1% {
            opacity: 1;
          }
          100% {
            transform: scale(1);
            border-color: #FFFFFF; /* End clean white */
            opacity: 1;
          }
        }
        .animate-stroke-pop {
          animation: popCircleStroke 0.65s cubic-bezier(0.34, 1.7, 0.4, 1) forwards;
        }
      `}} />
      
      {/* 🎯 PERFECT HOLLOW STROKE CIRCLE
          Grows fluidly from a tiny invisible center point while transitioning color from red to white */}
      <div 
        className="w-48 h-48 rounded-full border-[50px] bg-transparent mb-12 select-none shadow-2xl animate-stroke-pop"
        style={{ transform: 'scale(0)', opacity: 0 }}
      />
      
      {/* TEXT BLOCKS */}
      <p className="font-sans font-medium text-base leading-normal text-white/60 max-w-xs mb-8 tracking-normal animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300 fill-mode-both">
        We're building though. Know a story the worlds needs to hear? Nominate it and get your name in the credits.
      </p>

      {/* NOMINATE CALL TO ACTION */}
      <Link
        href="/nominate"
        className="px-8 h-12 inline-flex items-center justify-center font-sans font-bold text-base tracking-normal bg-white text-black hover:bg-white/90 rounded-full transition-all shadow-xl active:scale-95 duration-150 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-500 fill-mode-both"
      >
        Nominate
      </Link>
    </div>
  );
}