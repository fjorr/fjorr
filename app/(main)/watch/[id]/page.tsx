import React from 'react';
import Link from 'next/link';

interface WatchPageProps {
  params: Promise<{ id: string }>;
}

export default async function WatchPageTemplate({ params }: WatchPageProps) {
  // 🎯 Extract the specific video asset identifier from the URL parameter route safely
  const { id } = await params;

  return (
    <div className="w-full min-h-screen bg-black flex flex-col items-center justify-center p-0 m-0 overflow-hidden relative select-none">
      
      {/* 21:9 Widescreen Cinema Aspect Box Wrapper Container */}
      <div className="w-full aspect-[21/9] bg-zinc-950/50 flex flex-col items-center justify-center gap-4 border-y border-white/5 relative group transition-all">
        
        {/* Core Media Interface Control Node */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white/70 text-lg pl-1 hover:scale-105 hover:bg-white hover:text-black hover:border-white transition-all duration-300 cursor-pointer shadow-2xl">
            ▶
          </div>
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/20 animate-pulse mt-1">
            [ Streaming Active: {id} ]
          </span>
        </div>

        {/* Dynamic Return Navigation Hatch: Links back to its matching film info view */}
        <Link 
          href={`/film/${id}`} 
          className="absolute top-6 left-6 font-sans text-[11px] uppercase tracking-widest text-white/40 hover:text-white transition-colors bg-black/40 backdrop-blur-md px-4 py-2 rounded border border-white/10"
        >
          ← Exit Player
        </Link>

      </div>
    </div>
  );
}