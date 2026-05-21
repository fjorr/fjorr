'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronRight, Play, Pause } from 'lucide-react'; 

interface FilmAsset {
  id: string;
  name?: string;
  slug?: string;
  teaser?: string;
  story_date?: string;
  hero_wide?: string; 
  hero_clsx?: string; 
  hero_tall?: string; 
  title_art_code?: string; 
  title_art_hex?: string; 
  runtime?: number; 
  sponsor?: string;
  rating?: { name: string } | any;
  theme?: { name: string } | any;
}

interface FeatureRailProps {
  films: FilmAsset[];
  activeIndex: number;
  onSlideChange: (index: number) => void;
}

export default function FeatureRail({ films, activeIndex, onSlideChange }: FeatureRailProps) {
  const fallbackBg = 'linear-gradient(to bottom, #4C7A57, #36593E)';
  
  const [isPlaying, setIsPlaying] = useState(true);
  /* 🎯 FINE-TUNED TIMER ENGINE: Split 5000ms into 100ms precise visual ticking ticks */
  const [progress, setProgress] = useState(0); 
  const AUTOPLAY_DELAY = 5000;
  const TICK_RATE = 100;

  /* 🎯 MATHEMATICAL SVG GEOMETRY CONFIG */
  const RADIUS = 14;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // Formula: 2πr (~87.96)
  const strokeDashoffset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

  if (!films || films.length === 0) return null;
  
  const currentFilm = films[activeIndex] || films[0];
  if (!currentFilm) return null;

  /* 🎯 THE TICK TIMER EFFECT: Drives the circular timeline loader */
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          // Progress complete: Advance slide smoothly and reset timeline loop
          const nextTarget = activeIndex === films.length - 1 ? 0 : activeIndex + 1;
          onSlideChange(nextTarget);
          return 0;
        }
        return prevProgress + (TICK_RATE / AUTOPLAY_DELAY) * 100;
      });
    }, TICK_RATE);

    return () => clearInterval(timer);
  }, [isPlaying, activeIndex, films.length, onSlideChange]);

  /* 🎯 RESET VISUAL TRACK ON MANUAL SLIDE INTERACTIONS */
  useEffect(() => {
    setProgress(0);
  }, [activeIndex]);

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextTarget = activeIndex === 0 ? films.length - 1 : activeIndex - 1;
    onSlideChange(nextTarget);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextTarget = activeIndex === films.length - 1 ? 0 : activeIndex + 1;
    onSlideChange(nextTarget);
  };

  return (
    <section className="w-full flex justify-center bg-[#1F1F1F]">
      <div className="w-full max-w-[1440px] relative group/rail overflow-hidden rounded-none min-[1440px]:rounded-xl">
        
        {/* CAROUSEL IMAGE BODY ANCHOR */}
        <Link 
          href={`/film/${currentFilm.slug || ''}`}
          className="w-full intent-card block aspect-[1/1.618] md:aspect-[4/3] lg:aspect-[16/9] flex flex-col justify-end px-8 md:px-12 pb-14 md:pb-16 pt-16 md:pt-32 relative bg-cover bg-center transition-all duration-500 rounded-none min-[1440px]:rounded-xl cursor-pointer"
          style={{
            backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0) 100%)`
          }}
        >
          {/* RESPONSIVE PICTURE ENGINE */}
          <picture key={currentFilm.id} className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none group-hover/rail:scale-[1.01] transition-transform duration-700 animate-slide-fade">
            <source media="(min-width: 1024px)" srcSet={currentFilm.hero_wide} />
            <source media="(min-width: 768px)" srcSet={currentFilm.hero_clsx || currentFilm.hero_wide} />
            <img 
              src={currentFilm.hero_tall || currentFilm.hero_clsx || currentFilm.hero_wide} 
              alt={currentFilm.name || "Featured Film Asset"} 
              className="w-full h-full object-cover"
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
            style={{
              background: 'linear-gradient(to top, #000000BF 0%, #00000000 100%)'
            }}
          />

          {/* CONTENT DISCOVERY TEXT BLOCK */}
          <div className="relative z-20 max-w-2xl w-full flex flex-col text-center md:text-left items-center md:items-start mx-auto md:mx-0">
            {currentFilm.sponsor && (
              <div className="w-full font-sans font-bold text-[13px] text-white/90 tracking-wide mb-2.5 antialiased">
                {currentFilm.sponsor} <span className="text-white/50">presents</span>
              </div>
            )}

            {currentFilm.title_art_code ? (
              <div 
                className="mb-4 max-w-[220px] md:max-w-[280px] w-full [&>svg]:w-full [&>svg]:h-auto mx-auto md:mx-0 transition-transform duration-300"
                style={{ color: currentFilm.title_art_hex || '#FFFFFF' }}
                dangerouslySetInnerHTML={{ __html: currentFilm.title_art_code }}
              />
            ) : (
              currentFilm.name && (
                <h2 className="text-[28px] md:text-[36px] font-sans font-black uppercase tracking-tight leading-none text-white mb-3">
                  {currentFilm.name}
                </h2>
              )
            )}

            <div className="flex items-center justify-center md:justify-start gap-2.5 font-mono text-[14px] text-white/60 tracking-tight mb-2">
              {(() => {
                const ratingVal = typeof currentFilm.rating === 'object' ? currentFilm.rating?.name : currentFilm.rating;
                if (!ratingVal) return null;
                return (
                  <span className="px-1 py-0.25 border border-white/70 rounded-[4px] text-white/70 font-extrabold text-[12px] uppercase">
                    {ratingVal}
                  </span>
                );
              })()}

              {(() => {
                const themeVal = typeof currentFilm.theme === 'object' ? currentFilm.theme?.name : currentFilm.theme;
                if (!themeVal) return null;
                return (
                  <span className="capitalize font-semibold text-white/70">
                    {themeVal}
                  </span>
                );
              })()}

              <span className="font-semibold text-white/70">
                {(() => {
                  const rawSeconds = currentFilm.runtime || 0;
                  const finalValue = Math.ceil(rawSeconds / 60);
                  return finalValue === 0 ? "1m" : `${finalValue}m`;
                })()}
              </span>
            </div>

            <p className="font-sans font-medium text-[16px] leading-[1.4em] text-white/80 max-w-xs md:max-w-xs tracking-normal">
              {currentFilm.teaser}
            </p>
          </div>
        </Link>

        {/* =========================================================================
           🎬 CAROUSEL NAVIGATION TRACKS
           ========================================================================= */}
        <div className="absolute inset-x-0 bottom-8 z-30 flex items-center justify-center pointer-events-none px-8 md:px-12">
          
          {/* CENTER INDICATOR DOT TRACK */}
          <div className="flex items-center justify-center gap-2 pointer-events-auto">
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

          {/* RIGHT DIRECTIONAL CONTROLS */}
          <div className="hidden md:flex absolute right-6 items-center gap-2.5 pointer-events-auto">
            
            {/* 🎯 THE OVERHAULED CYLINDRICAL COUNTDOWN TIMELINE BUTTON */}
            <button 
              onClick={handleTogglePlay}
              className="w-8 h-8 relative rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200 active:scale-95 bg-white/10 hover:bg-white/15"
              aria-label={isPlaying ? "Pause autoplay loop" : "Start autoplay loop"}
            >
              {/* VECTORS FOR PROGRESS RING TRACKS */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                {/* Underlying muted base canvas track circle */}
                <circle
                  cx="16"
                  cy="16"
                  r={RADIUS}
                  fill="transparent"
                  stroke="rgba(255, 255, 255, 0.25)"
                  strokeWidth="2"
                />
                {/* Active vector path tracking real-time playback state updates */}
                <circle
                  cx="16"
                  cy="16"
                  r={RADIUS}
                  fill="transparent"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-100 ease-linear"
                  strokeLinecap="round"
                />
              </svg>

              {/* DYNAMIC PLAYER ICON OVERLAYS */}
              <div className="relative z-10 text-white flex items-center justify-center">
                {isPlaying ? (
                  <Pause size={12} fill="currentColor" />
                ) : (
                  <Play size={12} fill="currentColor" className="translate-x-[0.5px]" />
                )}
              </div>
            </button>

            {/* Prev Button */}
            <button 
              onClick={handlePrev}
              className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center backdrop-blur-sm hover:bg-white/20 active:scale-95 transition-all duration-200"
            >
              <ChevronRight size={16} className="rotate-180" />
            </button>
            
            {/* Next Button */}
            <button 
              onClick={handleNext}
              className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center backdrop-blur-sm hover:bg-white/20 active:scale-95 transition-all duration-200"
            >
              <ChevronRight size={16} />
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