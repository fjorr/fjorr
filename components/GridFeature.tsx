'use client';

import React from 'react';
import Link from 'next/link'; // 🎯 IMPORT THE NEXT.JS LINK ROUTER

interface FilmProps {
  film: {
    id: string;
    name?: string;
    teaser?: string;
    description?: string;
    hero_wide?: string; 
    hero_clsx?: string; 
    hero_tall?: string; 
    title_art_code?: string; 
    title_art_hex?: string; 
    runtime?: number; 
    rating?: any;
    theme?: any;
  };
}

export default function GridFeature({ film }: FilmProps) {
  const fallbackBg = 'linear-gradient(to bottom, #4C7A57, #36593E)';

  return (
    <section className="w-full">
      {/* 🎯 THE FIX: Changed the wrapping div into a Next.js Link pointing directly to your film route */}
      <Link 
        href={`/film/${film.id}`}
        /* Added 'cursor-pointer' to make the whole card interactive */
        className="w-full intent-card block aspect-[1/1.618] md:aspect-[4/3] lg:aspect-[16/9] flex flex-col justify-end px-[10%] pb-16 pt-32 relative overflow-hidden bg-cover bg-center transition-all duration-500 group cursor-pointer"
        style={{
          backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0) 100%)`
        }}
      >
        
        {/* THE RESPONSIVE POSTER LAYER */}
        <picture className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none group-hover:scale-[1.01] transition-transform duration-700">
          <source media="(min-width: 1024px)" srcSet={film.hero_wide || film.hero_clsx} />
          <source media="(min-width: 768px)" srcSet={film.hero_clsx || film.hero_wide} />
          <img 
            src={film.hero_tall || film.hero_clsx || film.hero_wide} 
            alt={film.name || "Featured Film Asset"} 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.parentElement?.parentElement) {
                e.currentTarget.parentElement.parentElement.style.background = fallbackBg;
              }
            }}
          />
        </picture>

        {/* THE 50% HEIGHT GRADIENT INTERFACE LAYER */}
        <div 
          className="absolute inset-x-0 bottom-0 h-1/2 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, #000000BF 0%, #00000000 100%)'
          }}
        />

        {/* DYNAMIC TYPOGRAPHY OVERLAY CONTENT LAYER */}
        <div className="relative z-20 max-w-2xl text-left">
          <span className="font-mono text-[11px] bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-white/80 select-all tracking-wider capitalize inline-block mb-3 border border-white/5 font-bold">
            Exclusive
          </span>
          
          {/* THE RESPONSIVE DYNAMIC SVG TITLE ARTWORK INJECTOR */}
          {film.title_art_code ? (
            <div 
              className="mb-4 max-w-[220px] md:max-w-[280px] [&>svg]:w-full [&>svg]:h-auto transition-transform duration-300"
              style={{ color: film.title_art_hex || '#FFFFFF' }}
              dangerouslySetInnerHTML={{ __html: film.title_art_code }}
            />
          ) : (
            film.name && (
              <h2 className="text-[28px] md:text-[36px] font-sans font-black uppercase tracking-tight leading-none text-light-01 mb-3">
                {film.name}
              </h2>
            )
          )}

          {/* METADATA CONTAINER ROW (Join-Safe & Fallback-Proof) */}
          <div className="flex items-center gap-2.5 font-mono text-[14px] text-white/60 tracking-tight mb-3">
            {/* 1. Rating Badge */}
            {(() => {
              const ratingVal = typeof film.rating === 'object' ? film.rating?.name : film.rating;
              if (!ratingVal) return null;
              return (
                <span className="px-1 py-0.25 border border-white/70 rounded-[4px] text-white/70 font-extrabold text-[12px] uppercase">
                  {ratingVal}
                </span>
              );
            })()}

            {/* 2. Theme Metadata */}
            {(() => {
              const themeVal = typeof film.theme === 'object' ? film.theme?.name : film.theme;
              if (!themeVal) return null;
              return (
                <span className="capitalize font-semibold text-white/70">
                  {themeVal}
                </span>
              );
            })()}

            {/* 4. Converted Runtime Display */}
            <span className="font-semibold text-white/70">
              {(() => {
                const rawSeconds = film.runtime || 0;
                const finalValue = Math.ceil(rawSeconds / 60);
                if (finalValue === 0) return "1m";
                return `${finalValue}m`;
              })()}
            </span>
          </div>

          {/* TEASER TEXT LAYER */}   
          <p className="font-sans font-medium text-[16px] leading-[1.5em] text-white/80 max-w-sm tracking-tight">
            {film.teaser}
          </p>
        </div>
      </Link>
    </section>
  );
}