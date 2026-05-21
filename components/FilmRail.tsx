'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';

interface FilmRailProps {
  title: string;
  films: any[];
}

export default function FilmRail({ title, films: rawFilms }: FilmRailProps) {
  const containerRef = useRef<HTMLDivElement>(null); // Track the component cross section visibility
  const railRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [isMobile, setIsMobile] = useState(false);
  
  /* 🎬 SCROLL INTERSECTION TRACKING STATE */
  const [hasEnteredScreen, setHasEnteredScreen] = useState(false);

  const activeFilms = rawFilms || [];

  useEffect(() => {
    /* 🌟 THE VISIBILITY OBSERVATION ENGINE */
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEnteredScreen(true);
          // Once triggered, disconnect the observer loop to lock in layout frames permanently
          if (containerRef.current) observer.unobserve(containerRef.current);
        }
      },
      { 
        threshold: 0.1, // Fire the stagger sequence when 10% of the rail canvas enters screen view 
        rootMargin: '0px 0px -40px 0px' // Offset edge firing slightly to guarantee a smooth scroll-in read
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);

      if (width >= 1024) setItemsPerPage(6);
      else if (width >= 768) setItemsPerPage(4);
      else setItemsPerPage(3);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalPages = Math.ceil(activeFilms.length / itemsPerPage);
  const showNavigation = totalPages > 1;

  const handleScroll = () => {
    if (railRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = railRef.current;
      if (scrollWidth > clientWidth) {
        const currentGap = window.innerWidth >= 1024 ? 24 : window.innerWidth >= 768 ? 20 : 16;
        const itemWidth = (scrollWidth + currentGap) / activeFilms.length;
        const calculatedPage = Math.round(scrollLeft / (itemWidth * itemsPerPage));
        const safePage = Math.max(0, Math.min(calculatedPage, totalPages - 1));
        setCurrentPage(safePage);
      }
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (railRef.current) {
      const { scrollLeft, clientWidth } = railRef.current;
      const scrollAmount = clientWidth; 
      
      const targetScroll = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      railRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
  };

  if (activeFilms.length === 0) return null;

  const formatIndex = (num: number) => String(num).padStart(2, '0');

  return (
    /* 🎯 PARENT CONTAINER INTERSECTION BOUNDARY: Assigned containerRef here to watch scroll coordinates */
    <section ref={containerRef} className="w-full pb-12 relative group/rail select-none z-20 px-8 md:px-16">
      <style dangerouslySetInnerHTML={{__html: `.no-scrollbar::-webkit-scrollbar { display: none !important; }`}} />

      <div className="w-full max-w-[1440px] mx-auto relative">
        
        {/* HEADER 
            🎯 REVEAL INJECTION: Clamped with conditional styling framework. 
            Starts invisible and slides up gracefully for 800ms when the container becomes active.
        */}
        <div className={`w-full flex items-center justify-between mb-4 transition-all duration-800 ease-out transform ${
          hasEnteredScreen 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-4'
        }`}>
          <h3 className="font-sans font-bold text-[18px] text-white/90 tracking-tight capitalize whitespace-nowrap">
            {title}
          </h3>
          
          {showNavigation && (
            <div className="flex items-center gap-3">
              <span className="font-mono text-[14px] font-bold tracking-wider text-white/30 select-none bg-transparent py-1 px-1">
                <span className="text-white/80">{formatIndex(currentPage + 1)}</span>
                <span className="mx-1 text-white/20">/</span>
                {formatIndex(totalPages)}
              </span>

              {!isMobile && (
                <div className="flex items-center gap-1.5">
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
              )}
            </div>
          )}
        </div>

        {/* HORIZONTAL CAROUSEL */}
        <div className="w-full overflow-hidden rounded-[8px]">
          <div 
            ref={railRef} 
            onScroll={handleScroll}
            className="no-scrollbar w-full grid grid-flow-col auto-cols-[calc((100%-2rem)/3)] md:auto-cols-[calc((100%-3.75rem)/4)] lg:auto-cols-[calc((100%-7.5rem)/6)] gap-4 md:gap-5 lg:gap-6 overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory" 
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {activeFilms.map((film, index) => {
              const filmUrlParam = film.slug || film.id;
              
              /* 🎯 STAGGER CALCULATION: Compiles incremental delay layers based on the poster item card index position */
              const posterDelay = `${150 + index * 75}ms`;

              return (
                <Link 
                  key={index} 
                  href={`/film/${filmUrlParam}`} 
                  className={`w-full shrink-0 snap-start group/card block transition-all duration-700 ease-out transform ${
                    hasEnteredScreen 
                      ? 'opacity-100 translate-y-0 scale-100' 
                      : 'opacity-0 translate-y-6 scale-[0.98]'
                  }`}
                  /* Passes the custom offset duration calculation rule safely directly to the canvas loop node */
                  style={{ transitionDelay: hasEnteredScreen ? posterDelay : '0ms' }}
                >
                  <div className="w-full aspect-[2/3] rounded-[8px] bg-zinc-900/40 border border-white/5 overflow-hidden relative transition-all duration-300 group-hover/card:scale-[1.02] shadow-xl flex items-center justify-center">
                    {film.blok_tall ? (
                      <img src={film.blok_tall} alt={film.name || "Movie Poster"} className="w-full h-full object-cover pointer-events-none" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-4 text-center text-white/30 font-sans font-medium text-[11px]" style={{ background: 'linear-gradient(to bottom, #1C1C1E, #0A0A0C)' }}>
                        {film.name}
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