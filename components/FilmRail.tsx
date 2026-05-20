'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';

interface FilmRailProps {
  title: string;
  films: any[];
}

export default function FilmRail({ title, films: rawFilms }: FilmRailProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  const activeFilms = rawFilms && rawFilms.length > 0 
    ? Array.from({ length: 18 }, (_, i) => rawFilms[i % rawFilms.length]) 
    : [];

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1024) setItemsPerPage(6);
      else if (width >= 768) setItemsPerPage(4);
      else setItemsPerPage(3);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalPages = Math.ceil(activeFilms.length / itemsPerPage);

  const handleScroll = () => {
    if (railRef.current) {
      const { scrollLeft, clientWidth } = railRef.current;
      if (clientWidth > 0) {
        const newPage = Math.round(scrollLeft / clientWidth);
        if (newPage >= 0 && newPage < totalPages) {
          setCurrentPage(newPage);
        }
      }
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (railRef.current) {
      const { scrollLeft, clientWidth } = railRef.current;
      const scrollAmount = clientWidth; 
      
      const targetScroll = direction === 'left' 
        ? scrollLeft - scrollAmount 
        : scrollLeft + scrollAmount;

      railRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      });
    }
  };

  if (!activeFilms || activeFilms.length === 0) return null;

  const formatIndex = (num: number) => String(num).padStart(2, '0');

  return (
    <section className="w-full pb-12 relative group/rail select-none z-20 px-8 md:px-16">
      <div className="w-full max-w-[1440px] mx-auto relative">
        
        <div className="w-full flex items-center justify-between mb-4">
          <h3 className="font-sans font-bold text-[18px] text-white/90 tracking-tight capitalize whitespace-nowrap">
            {title}
          </h3>
          
          <div className="flex items-center gap-3">
            <span className="font-mono text-[14px] font-bold tracking-wider text-white/30 select-none bg-transparent py-1 px-1">
              <span className="text-white/80">{formatIndex(currentPage + 1)}</span>
              <span className="mx-1 text-white/20">/</span>
              {formatIndex(totalPages)}
            </span>

            <div className="flex items-center gap-1.5">
              {/* 🎯 BORDERLESS NAVIGATION BUTTONS */}
              <button 
                onClick={() => scroll('left')} 
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/80 transition-all duration-200 text-[16px] font-sans font-bold cursor-pointer pb-0.5"
              >
                &lsaquo;
              </button>
              <button 
                onClick={() => scroll('right')} 
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/80 transition-all duration-200 text-[16px] font-sans font-bold cursor-pointer pb-0.5"
              >
                &rsaquo;
              </button>
            </div>
          </div>
        </div>

        <div className="w-full overflow-hidden rounded-[8px]">
          <div 
            ref={railRef} 
            onScroll={handleScroll}
            className="w-full grid grid-flow-col auto-cols-[calc((100%-2rem)/3)] md:auto-cols-[calc((100%-3rem)/4)] lg:auto-cols-[calc((100%-5rem)/6)] gap-4 overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory" 
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <style dangerouslySetInnerHTML={{__html: `
              div::-webkit-scrollbar { display: none; }
            `}} />

            {activeFilms.map((film, index) => {
              const filmUrlParam = film.slug || film.id;

              return (
                <Link 
                  key={index} 
                  href={`/film/${filmUrlParam}`}
                  className="w-full shrink-0 snap-start group/card cursor-pointer block"
                >
                  <div className="w-full aspect-[2/3] rounded-[8px] bg-zinc-900/40 border border-white/5 overflow-hidden relative transition-all duration-300 group-hover/card:scale-[1.02] shadow-xl flex items-center justify-center">
                    {film.blok_tall ? (
                      <img 
                        src={film.blok_tall} 
                        alt={film.name || "Movie Poster"} 
                        className="w-full h-full object-cover pointer-events-none" 
                        loading="lazy" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-4 text-center text-white/30 font-sans font-medium text-[11px]" style={{ background: 'linear-gradient(to bottom, #1C1C1E, #0A0A0C)' }}>
                        {film.name} {index + 1}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}