'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';

interface ArtifactRailProps {
  title: string;
  artifacts: any[];
}

export default function ArtifactRail({ title, artifacts: rawArtifacts }: ArtifactRailProps) {
  const containerRef = useRef<HTMLDivElement>(null); // Parent container boundaries stage reference
  const railRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [isMobile, setIsMobile] = useState(false);
  
  /* 🎬 SCROLL INTERSECTION TRACKING STATE */
  const [hasEnteredScreen, setHasEnteredScreen] = useState(false);

  // Filter out any broken elements missing an active slug property
  const filteredArtifacts = (rawArtifacts || []).filter((item) => {
    const artifact = item?.artifact ? item.artifact : item;
    return artifact && artifact.slug;
  });

  // Only use the actual artifacts passed in—no forced 18-slot looping
  const activeArtifacts = filteredArtifacts;

  /* 🌟 THE VISIBILITY OBSERVATION ENGINE */
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEnteredScreen(true);
          // Disconnect once tracked so layouts lock permanently during horizontal navigation passes
          if (containerRef.current) observer.unobserve(containerRef.current);
        }
      },
      { 
        threshold: 0.1, // Fires when 10% of the rail canvas appears inside the viewport view frame
        rootMargin: '0px 0px -40px 0px' // Optical offset to guarantee the scroll looks fully intentional
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Handle items per page and mobile viewport detection state updates
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      
      // Explicit state toggle flag for conditional DOM demolition
      setIsMobile(width < 768);

      if (width >= 1024) setItemsPerPage(6);
      else if (width >= 768) setItemsPerPage(4);
      else setItemsPerPage(3);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculates true total pages based on how many items are actually visible on screen
  const totalPages = Math.ceil(activeArtifacts.length / itemsPerPage) || 1;

  // 🎯 FIXED SCROLL PROGRESS ENGINE: Dynamically maps tracking based on current fluid gap size
  const handleScroll = () => {
    if (railRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = railRef.current;
      
      if (scrollWidth > clientWidth) {
        const currentGap = window.innerWidth >= 1024 ? 24 : window.innerWidth >= 768 ? 20 : 16;
        const itemWidth = (scrollWidth + currentGap) / activeArtifacts.length;
        
        // Maps the scroll placement parameter index directly onto our visible groupings
        const calculatedPage = Math.round(scrollLeft / (itemWidth * itemsPerPage));
        
        // Safety lock preventing trailing indexes from overflowing array page length boundaries
        const safePage = Math.max(0, Math.min(calculatedPage, totalPages - 1));
        setCurrentPage(safePage);
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

  if (!activeArtifacts || activeArtifacts.length === 0) return null;

  const formatIndex = (num: number) => String(num).padStart(2, '0');

  return (
    /* 🎯 PARENT CONTAINER INTERSECTION BOUNDARY: Linked with containerRef to intercept screen viewport entry */
    <section ref={containerRef} className="w-full pb-0 relative group/rail select-none z-20 px-8 md:px-16">
      
      {/* Scrollbar hidden styling core structure element */}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { 
          display: none !important; 
        }
      `}} />

      <div className="w-full max-w-[1440px] mx-auto relative">
        
        {/* HEADER TRACK COMPONENT ROW 
            🎯 REVEAL INJECTION: Transitions gracefully upward from vertical baseline shifts upon viewport intersection 
        */}
        <div className={`w-full flex items-center justify-between mb-4 transition-all duration-800 ease-out transform ${
          hasEnteredScreen 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-4'
        }`}>
          <h3 className="font-sans font-bold text-[18px] text-white/90 tracking-tight capitalize whitespace-nowrap">
            {title}
          </h3>
          
          <div className="flex items-center gap-3">
            {/* The counter numbers: Static layout always present on all devices */}
            <span className="font-mono text-[14px] font-bold tracking-wider text-white/30 select-none bg-transparent py-1 px-1">
              <span className="text-white/80">{formatIndex(currentPage + 1)}</span>
              <span className="mx-1 text-white/20">/</span>
              {formatIndex(totalPages)}
            </span>

            {/* 🎯 CONDITIONAL HARD DEMOLITION TERNARY: 
                If device viewport is determined mobile (< 768px), this node layer is deleted completely */}
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
        </div>

        {/* ARTIFACT CAROUSEL WINDOW PANELS */}
        <div className="w-full overflow-hidden rounded-[8px]">
          <div 
            ref={railRef} 
            onScroll={handleScroll}
            className="no-scrollbar w-full grid grid-flow-col auto-cols-[calc((100%-2rem)/3)] md:auto-cols-[calc((100%-3.75rem)/4)] lg:auto-cols-[calc((100%-7.5rem)/6)] gap-4 md:gap-5 lg:gap-6 overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory" 
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {activeArtifacts.map((item, index) => {
              const artifact = item?.artifact ? item.artifact : item;

              /* 🎯 STAGGER ENGINE: Builds cascading entry transitions using increments based on index locations */
              const cardDelay = `${150 + index * 75}ms`;

              return (
                <Link 
                  key={index} 
                  href={`/artifact/${artifact.slug}`}
                  className={`w-full shrink-0 snap-start group/card cursor-pointer block transition-all duration-700 ease-out transform ${
                    hasEnteredScreen 
                      ? 'opacity-100 translate-y-0 scale-100' 
                      : 'opacity-0 translate-y-6 scale-[0.98]'
                  }`}
                  /* Safely injects the transitionDelay parameter string to create the visual trailing wave */
                  style={{ transitionDelay: hasEnteredScreen ? cardDelay : '0ms' }}
                >
                  <div className="w-full aspect-[2/3] rounded-[8px] bg-zinc-900/40 border border-white/5 overflow-hidden relative transition-all duration-300 group-hover/card:scale-[1.02] shadow-xl flex items-center justify-center">
                    {artifact.blok_tall && (
                      <img 
                        src={artifact.blok_tall} 
                        alt={artifact.name} 
                        className="w-full h-full object-cover pointer-events-none" 
                        loading="lazy" 
                      />
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