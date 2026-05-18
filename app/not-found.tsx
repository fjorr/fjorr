import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="w-full min-h-[70vh] flex flex-col items-center justify-center text-center px-6 bg-dark-01 text-white">
      <span className="font-sans text-[13px] tracking-[0.2em] text-white/40 uppercase mb-4">
        Error 404
      </span>
      <h1 className="font-tradeGothic text-5xl md:text-7xl uppercase tracking-tighter mb-4 max-w-xl">
        Frame Missing
      </h1>
      <p className="font-sans text-white/60 text-[15px] max-w-prose leading-relaxed mb-8">
        The route or architectural asset you are trying to stream-buffer cannot be found.
      </p>
      
      <Link 
        href="/" 
        className="font-sans font-medium text-[15px] text-white/80 hover:text-white underline underline-offset-4 transition-colors"
      >
        Return to Landing view
      </Link>
    </div>
  );
}