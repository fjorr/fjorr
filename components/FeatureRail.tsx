'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface FilmAsset {
  id: string;
  name?: string;
  slug?: string;
  teaser?: string;
  story_date?: string | { name: string } | any;
  hero_wide?: string; 
  hero_clsx?: string; 
  hero_tall?: string; 
  title_art_code?: string; 
  title_art_hex?: string; 
  title_art_scale?: number; 
  runtime?: number; 
  sponsor?: string | { name: string } | any; 
  sponsor_id?: string;
  rating?: { name: string } | any;
  theme?: { name: string } | any;
}

interface FeatureRailProps {
  films: FilmAsset[];
  activeIndex: number;
  onSlideChange: (index: number) => void;
  onPlayClick: (film: FilmAsset) => void; 
  isTheaterActive?: boolean; 
}

export default function FeatureRail({ films, activeIndex, onSlideChange, onPlayClick, isTheaterActive = false }: FeatureRailProps) {
  const fallbackBg = 'linear-gradient(to bottom, #4C7A57, #36593E)';
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0); 
  const AUTOPLAY_DELAY = 5000;
  const TICK_RATE = 100;

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const RADIUS = 18.75;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS; 
  const strokeDashoffset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

  if (!films || films.length === 0) return null;
  
  const currentFilm = films[activeIndex] || films[0];
  if (!currentFilm) return null;

  // 🎯 SPONSOR DATA EXTRACTION MATCHED
  const getSponsorName = () => {
    if (currentFilm.sponsor?.name) return currentFilm.sponsor.name;
    if (typeof currentFilm.sponsor === 'string') return currentFilm.sponsor;
    if (currentFilm.sponsor_id === '0afb5b63-1e90-4a37-824d-33cc41afde3d') {
      return 'Mercedes-Benz';
    }
    return null;
  };

  const sponsorName = getSponsorName();

  // 📐 CLEAN MAX-WIDTH MATH MATCHED
  const baselineWidth = 300; 
  const currentScale = currentFilm.title_art_scale || 1.0;
  const calculatedWidth = `${baselineWidth * currentScale}px`;

  useEffect(() => {
    if (!isPlaying || isTheaterActive) return;

    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          const nextTarget = activeIndex === films.length - 1 ? 0 : activeIndex + 1;
          
          setTimeout(() => {
            onSlideChange(nextTarget);
          }, 0);

          return 0;
        }
        return prevProgress + (TICK_RATE / AUTOPLAY_DELAY) * 100;
      });
    }, TICK_RATE);

    return () => clearInterval(timer);
  }, [isPlaying, activeIndex, films.length, onSlideChange, isTheaterActive]);

  useEffect(() => {
    setProgress(0);
  }, [activeIndex]);

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  const navigatePrev = () => {
    const nextTarget = activeIndex === 0 ? films.length - 1 : activeIndex - 1;
    onSlideChange(nextTarget);
  };

  const navigateNext = () => {
    const nextTarget = activeIndex === films.length - 1 ? 0 : activeIndex + 1;
    onSlideChange(nextTarget);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const totalSwipeDistance = touchStartX.current - touchEndX.current;
    const swipeThreshold = 50; 

    if (totalSwipeDistance > swipeThreshold) {
      navigateNext();
    } else if (totalSwipeDistance < -swipeThreshold) {
      navigatePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const getRuntimeDisplay = () => {
    const rawSeconds = currentFilm.runtime || 0;
    const finalValue = Math.ceil(rawSeconds / 60);
    return finalValue === 0 ? "1m" : `${finalValue}m`;
  };

  return (
    <section className="w-full flex justify-center bg-[#1F1F1F]">
      <div className="w-full max-w-[1440px] relative group/rail overflow-hidden rounded-none min-[1440px]:rounded-xl">
        
        <div 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full relative aspect-[1/1.618] md:aspect-[4/3] lg:aspect-[16/9] overflow-hidden rounded-none min-[1440px]:rounded-xl select-none"
        >
          <Link 
            href={`/film/${currentFilm.slug || ''}`}
            className="absolute inset-0 w-full h-full block z-0 cursor-pointer"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0) 100%)'
            }}
          >
            <picture key={currentFilm.id} className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none group-hover/rail:scale-[1.01] transition-transform duration-700 animate-slide-fade">
              <source media="(min-width: 1024px)" srcSet={currentFilm.hero_wide} />
              <source media="(min-width: 768px)" srcSet={currentFilm.hero_clsx || currentFilm.hero_wide} />
              <img 
                src={currentFilm.hero_tall || currentFilm.hero_clsx || currentFilm.hero_wide} 
                alt={currentFilm.name || "Featured Film Asset"} 
                className="w-full h-full object-cover"
                fetchPriority="high"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.parentElement?.parentElement) {
                    e.currentTarget.parentElement.style.background = fallbackBg;
                  }
                }}
              />
            </picture>

            <div 
              className="absolute inset-x-0 bottom-0 h-1/2 z-10 pointer-events-none"
              style={{ background: 'linear-gradient(to top, #000000BF 0%, #00000000 100%)' }}
            />
          </Link>

          <div className="absolute inset-x-0 bottom-0 px-8 md:px-12 pb-14 md:pb-16 pt-16 md:pt-32 z-20 max-w-2xl w-full flex flex-col text-center md:text-left items-center md:items-start mx-auto md:mx-0 pointer-events-none">
            
            {/* 🎯 RESOLVED SPONSOR VIEWPORT */}
            {sponsorName && (
              <div className="w-full font-sans font-bold text-[13px] text-white/90 tracking-wide mb-2.5 antialiased">
                {sponsorName} <span className="font-medium text-white/70">presents</span>
              </div>
            )}

            {currentFilm.title_art_code ? (
              /* 🎯 ROCK-SOLID HORIZONTAL SCALE CONTAINER MATCHED */
              <div 
                className="mb-4 w-full max-w-[240px] md:max-w-[380px] flex items-center justify-center md:justify-start [&>svg]:w-full [&>svg]:h-auto" 
                style={{ 
                  color: currentFilm.title_art_hex || '#FFFFFF',
                  '--desktop-width': calculatedWidth
                } as React.CSSProperties}
              >
                {/* Responsive Width Override Block */}
                <div 
                  className="w-full md:w-[var(--desktop-width)]"
                  dangerouslySetInnerHTML={{ __html: currentFilm.title_art_code }}
                />
              </div>
            ) : (
              currentFilm.name && (
                <h2 className="text-[28px] md:text-[36px] font-sans font-black uppercase tracking-tight leading-none text-white mb-3">
                  {currentFilm.name}
                </h2>
              )
            )}

            {/* 🎯 UPDATED METADATA GRID CONTAINER ROW */}
            <div className="flex items-center justify-center md:justify-start gap-2.5 font-sans text-sm text-white/40 tracking-normal mb-2 select-none">
              {(() => {
                const ratingVal = typeof currentFilm.rating === 'object' ? currentFilm.rating?.name : currentFilm.rating;
                if (!ratingVal) return null;
                return (
                  <span className="px-1 py-0.25 border border-white/60 rounded-[4px] text-white/60 font-semibold text-[12px] uppercase">
                    {ratingVal}
                  </span>
                );
              })()}

              {(() => {
                const themeVal = typeof currentFilm.theme === 'object' ? currentFilm.theme?.name : currentFilm.theme;
                if (!themeVal) return null;
                return (
                  <span className="capitalize font-medium text-white/60">
                    {themeVal}
                  </span>
                );
              })()}

              {/* 🎯 INJECTED CLEAN STORY DATE MARKER */}
              {(() => { 
                const storyDateVal = typeof currentFilm.story_date === 'object' ? currentFilm.story_date?.name : currentFilm.story_date; 
                if (!storyDateVal) return null; 
                return <span className="text-white/60 font-medium">{storyDateVal}</span>; 
              })()}
            </div>

            <p className="font-sans font-medium text-sm leading-[1.4em] text-white/80 max-w-xs md:max-w-xs tracking-normal mb-6">
              {currentFilm.teaser}
            </p>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onPlayClick(currentFilm);
              }}
              className="h-10 px-6 inline-flex items-center justify-center gap-2 bg-white hover:bg-white/90 text-black font-sans font-bold text-sm tracking-normal rounded-full transition-all active:scale-[0.98] duration-150 shadow-lg pointer-events-auto cursor-pointer border-0 outline-none"
            >
              <img 
                src="/icons/play.svg" 
                className="w-4 h-4 select-none object-contain translate-y-[0.5px]" 
                alt="Play Icon" 
              />
              <span>Play {getRuntimeDisplay()}</span>
            </button>
          </div>
        </div>

        {/* CONTROLS BAR SECTION LAYER */}
        <div className="absolute inset-x-0 bottom-8 z-30 flex items-center justify-center pointer-events-none px-8 md:px-12">
          
          {/* Slider Position Indicator Dots Layer */}
          <div className="flex items-center justify-center gap-2 pointer-events-auto mx-auto">
            {films.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  onSlideChange(index);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  index === activeIndex ? 'bg-white scale-125' : 'bg-white/25 hover:bg-white/50'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Unified Layout Control Buttons Layer */}
          <div className="absolute right-6 md:right-12 flex items-center gap-2 pointer-events-auto">
            
            {/* PROGRESS TOGGLE BUTTON CONTAINER */}
            <button 
              onClick={handleTogglePlay}
              className="w-10 h-10 relative rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200 active:scale-95 bg-white/10 hover:bg-white/20 border border-white/10 overflow-hidden transform-gpu"
              aria-label={isPlaying ? "Pause autoplay loop" : "Start autoplay loop"}
            >
              <svg className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r={RADIUS} fill="transparent" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="2.5" />
                <circle
                  cx="20"
                  cy="20"
                  r={RADIUS}
                  fill="transparent"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-100 ease-linear"
                  strokeLinecap="round"
                />
              </svg>
              
              <div className="relative z-10 text-white flex items-center justify-center w-full h-full pointer-events-none">
                {isPlaying ? (
                  <div className="flex gap-[3px]">
                    <div className="w-1 h-3 bg-white rounded-full"></div>
                    <div className="w-1 h-3 bg-white rounded-full"></div>
                  </div>
                ) : (
                  <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor" className="translate-x-[1px]">
                    <path d="M2 1.5V12.5L11 7L2 1.5Z" />
                  </svg>
                )}
              </div>
            </button>

            {/* PREVIOUS SLIDE NAVIGATION CONTROLLER */}
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigatePrev(); }}
              className="hidden md:flex w-10 h-10 rounded-full bg-white/10 text-white items-center justify-center backdrop-blur-sm hover:bg-white/20 active:scale-95 transition-all duration-200 cursor-pointer "
            >
              <svg width="6" height="10" viewBox="0 0 6 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-180">
                <polyline points="1.5 8.5 5 5 1.5 1.5" />
              </svg>
            </button>
            
            {/* NEXT SLIDE NAVIGATION CONTROLLER */}
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigateNext(); }}
              className="hidden md:flex w-10 h-10 rounded-full bg-white/10 text-white items-center justify-center backdrop-blur-sm hover:bg-white/20 active:scale-95 transition-all duration-200 cursor-pointer "
            >
              <svg width="6" height="10" viewBox="0 0 6 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1.5 8.5 5 5 1.5 1.5" />
              </svg>
            </button>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideFadeIn {
          from { opacity: 0.6; }
          to { opacity: 1; }
        }
        .animate-slide-fade {
          animation: slideFadeIn 350ms cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
      `}} />
    </section>
  );
}