'use client';

import React from 'react';
import Link from 'next/link';
import { Play } from 'lucide-react';

interface FilmHeroProps {
  film: any;
}

export default function FilmHero({ film }: FilmHeroProps) {
  const fallbackBg = 'linear-gradient(to bottom, #4C7A57, #36593E)';
  
  const isReleased = film.release_date 
    ? new Date(film.release_date).getTime() <= new Date().getTime()
    : false;

  const getRuntimeDisplay = () => {
    const rawSeconds = film.runtime || 0;
    const finalValue = Math.ceil(rawSeconds / 60);
    return finalValue === 0 ? "1m" : `${finalValue}m`;
  };

  if (!film) return null;

  return (
    /* 🎯 FIXED: Changed rounded-none to min-[1440px]:rounded-xl and added spacing padding on wide monitors */
    <section className="w-full flex justify-center min-[1440px]:pt-6">
      <div className="w-full max-w-[1440px] relative overflow-hidden rounded-none min-[1440px]:rounded-xl shadow-2xl">
        
        {/* MAIN VISUAL ANCHOR STAGE */}
        <div 
          className="w-full block aspect-[1/1.618] md:aspect-[4/3] lg:aspect-[16/9] flex flex-col justify-end px-8 md:px-12 pb-14 md:pb-16 pt-32 relative bg-cover bg-center transition-all duration-500 select-none"
          style={{
            backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0) 100%)`
          }}
        >
          {/* RESPONSIVE PICTURE ENGINE */}
          <picture className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none">
            <source media="(min-width: 1024px)" srcSet={film.hero_wide} />
            <source media="(min-width: 768px)" srcSet={film.hero_clsx || film.hero_wide} />
            <img 
              src={film.hero_tall || film.hero_clsx || film.hero_wide} 
              alt={film.name || "Featured Film Asset"} 
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.parentElement?.parentElement) {
                  e.currentTarget.parentElement.style.background = fallbackBg;
                }
              }}
            />
          </picture>

          {/* 50% HEIGHT GRADIENT INTERFACE LAYER */}
          <div 
            className="absolute inset-x-0 bottom-0 h-1/2 z-10 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, #000000BF 0%, #00000000 100%)'
            }}
          />

          {/* CONTENT DISCOVERY TEXT BLOCK */}
          <div className="relative z-20 max-w-2xl w-full flex flex-col text-left items-start mt-auto">
            {film.sponsor && (
              <div className="w-full font-sans font-bold text-[13px] text-white/90 tracking-wide mb-2.5 antialiased">
                {film.sponsor} <span className="text-white/50">presents</span>
              </div>
            )}

            {/* VECTOR TITLE ARTWORK OR TYPOGRAPHY */}
            {film.title_art_code ? (
              <div 
                className="mb-4 max-w-[220px] md:max-w-[280px] w-full [&>svg]:w-full [&>svg]:h-auto transition-transform duration-300"
                style={{ color: film.title_art_hex || '#FFFFFF' }}
                dangerouslySetInnerHTML={{ __html: film.title_art_code }}
              />
            ) : (
              film.name && (
                <h1 className="text-[28px] md:text-[36px] font-sans font-black uppercase tracking-tight leading-none text-white mb-3">
                  {film.name}
                </h1>
              )
            )}

            {/* METADATA ROW */}
            <div className="flex items-center gap-2.5 font-mono text-[14px] text-white/60 tracking-tight mb-2 select-none">
              {(() => {
                const ratingVal = typeof film.rating === 'object' ? film.rating?.name : film.rating;
                if (!ratingVal) return null;
                return (
                  <span className="px-1 py-0.25 border border-white/70 rounded-[4px] text-white/70 font-extrabold text-[12px] uppercase">
                    {ratingVal}
                  </span>
                );
              })()}

              {(() => {
                const themeVal = typeof film.theme === 'object' ? film.theme?.name : film.theme;
                if (!themeVal) return null;
                return (
                  <span className="capitalize font-semibold text-white/70">
                    {themeVal}
                  </span>
                );
              })()}
            </div>

            {/* TEASER CONTAINER */}
            <p className="font-sans font-medium text-[16px] leading-[1.4em] text-white/80 max-w-xs md:max-w-xs tracking-normal mb-6">
              {film.teaser}
            </p>

            {/* CONTEXTUALIZED INTERACTIVE ACTION HOOK */}
            {isReleased ? (
              <Link
                href={`/watch/${film.slug || film.id}`}
                className="h-10 px-6 inline-flex items-center justify-center gap-2 bg-white hover:bg-white/90 text-black font-sans font-bold text-sm tracking-normal rounded-full transition-all active:scale-[0.98] duration-150 shadow-lg cursor-pointer"
              >
                <Play size={14} className="fill-current stroke-current" />
                <span>Play {getRuntimeDisplay()}</span>
              </Link>
            ) : (
              <div className="h-10 px-6 inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md text-white/40 font-sans font-bold text-sm tracking-normal rounded-full border border-white/5 select-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Coming Soon</span>
              </div>
            )}
          </div>

        </div>

      </div>
    </section>
  );
}