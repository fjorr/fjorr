'use client';

import React, { useRef } from 'react';
import Link from 'next/link';

interface ArtifactRailProps {
  title: string;
  artifacts: any[];
}

export default function ArtifactRail({ title, artifacts }: ArtifactRailProps) {
  const railRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (railRef.current) {
      const { scrollLeft, clientWidth } = railRef.current;
      const scrollAmount = clientWidth * 0.8; 
      railRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="w-full px-[10%] pb-12 relative group/rail select-none">
      <h3 className="font-sans font-bold text-[18px] text-white/90 tracking-tight mb-4 capitalize">
        {title}
      </h3>

      <div className="relative w-full">
        <button onClick={() => scroll('left')} className="absolute left-[-4%] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover/rail:opacity-100 transition-opacity duration-300 z-30 hidden md:flex">←</button>

        <div ref={railRef} className="w-full flex gap-4 overflow-x-auto overflow-y-hidden scroll-smooth no-scrollbar snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
          {artifacts.map((item, index) => {
            
            // 🎯 ADAPTER HANDLER: Reads nested join objects for profile pages, 
            // or falls back to standard properties for the global home page.
            const artifact = item?.artifact ? item.artifact : item;
            
            if (!artifact || !artifact.slug) return null;

            return (
              <Link 
                key={artifact.slug || index} 
                href={`/artifact/${artifact.slug}`}
                className="w-[45%] md:w-[23%] lg:w-[15%] shrink-0 snap-start group/card cursor-pointer block"
              >
                <div className="w-full aspect-[2/3] rounded-[8px] bg-white/5 border border-white/5 overflow-hidden relative transition-all duration-300 group-hover/card:scale-[1.03] shadow-lg">
                  {artifact.blok_tall ? (
                    <img src={artifact.blok_tall} alt={artifact.name} className="w-full h-full object-cover pointer-events-none" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-4 text-center text-white/30 font-mono text-[11px]" style={{ background: 'linear-gradient(to bottom, #3b3954, #272538)' }}>
                      {artifact.name}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        <button onClick={() => scroll('right')} className="absolute right-[-4%] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover/rail:opacity-100 transition-opacity duration-300 z-30 hidden md:flex">→</button>
      </div>
    </section>
  );
}