'use client';

import React, { useRef } from 'react';
import Link from 'next/link';

interface FilmRailProps {
  title: string;
  films: any[];
}

export default function FilmRail({ title, films }: FilmRailProps) {
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

  if (!films || films.length === 0) return null;

  return (
    <section className="w-full px-[10%] pb-12 relative group/rail select-none z-20">
      <h3 className="font-sans font-bold text-[18px] text-white/90 tracking-tight mb-4 capitalize">
        {title}
      </h3>

      <div className="relative w-full">
        {/* Left Arrow Button */}
        <button onClick={() => scroll('left')} className="absolute left-[-4%] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover/rail:opacity-100 transition-opacity duration-300 z-30 hidden md:flex">←</button>

        {/* Carousel Track Wrapper */}
        <div ref={railRef} className="w-full flex gap-4 overflow-x-auto overflow-y-hidden scroll-smooth no-scrollbar snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
          {films.map((film, index) => {
            
            // 🎯 THE SLUG ENFORCER: Explicitly targets the slug field for fjorr.com/film/shoebox format
            const filmUrlParam = film.slug || film.id;

            return (
              <Link 
                key={filmUrlParam || index} 
                href={`/film/${filmUrlParam}`}
                className="w-[45%] md:w-[23%] lg:w-[15%] shrink-0 snap-start group/card cursor-pointer block"
              >
                <div className="w-full aspect-[2/3] rounded-[8px] bg-white/5 border border-white/5 overflow-hidden relative transition-all duration-300 group-hover/card:scale-[1.03] shadow-lg flex items-center justify-center">
                  {film.blok_tall ? (
                    <img 
                      src={film.blok_tall} 
                      alt={film.name || "Movie Poster"} 
                      className="w-full h-full object-cover pointer-events-none" 
                      loading="lazy" 
                    />
                  ) : (
                    /* Typography card fallback if the image field is missing */
                    <div className="w-full h-full flex items-center justify-center p-4 text-center text-white/30 font-mono text-[11px]" style={{ background: 'linear-gradient(to bottom, #1C1C1E, #0A0A0C)' }}>
                      {film.name}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Right Arrow Button */}
        <button onClick={() => scroll('right')} className="absolute right-[-4%] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover/rail:opacity-100 transition-opacity duration-300 z-30 hidden md:flex">→</button>
      </div>
    </section>
  );
}