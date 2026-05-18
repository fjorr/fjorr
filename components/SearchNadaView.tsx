'use client';

import React from 'react';
import Link from 'next/link';

export default function SearchNadaView() {
  return (
    <div className="w-full py-16 flex flex-col items-center justify-center text-center max-w-md">
      <h1 className="font-tradeGothic text-7xl md:text-8xl font-black tracking-tighter uppercase text-white leading-none mb-6 select-none animate-pulse">
        NADA.
      </h1>
      
      <p className="font-sans font-medium text-[15px] leading-relaxed text-white/60 max-w-xs mb-8 tracking-tight">
        We're building though. Know a story the worlds needs to hear? Nominate it and get your name in the credits.
      </p>

      <Link
        href="/nominate"
        className="px-8 h-12 inline-flex items-center justify-center font-sans font-bold text-[14px] tracking-tight bg-white text-black hover:bg-white/90 rounded-full transition-all shadow-xl active:scale-95 duration-150"
      >
        Nominate
      </Link>
    </div>
  );
}