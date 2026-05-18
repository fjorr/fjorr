'use client';

import React from 'react';
import Link from 'next/link';

interface FilmHeroProps {
  film: any;
}

export default function FilmHero({ film }: FilmHeroProps) {
  const isReleased = film.release_date 
    ? new Date(film.release_date).getTime() <= new Date().getTime()
    : false;

  const runtimeMinutes = film.runtime ? Math.ceil(film.runtime / 60) : 1;
  const fallbackBg = 'linear-gradient(to bottom, #4C7A57, #36593E)';

  return (
    <section className="w-full relative overflow-hidden bg-black z-10">
      <div 
        /* Enforces structural container constraints while allowing the background picture to anchor edge-to-edge */
        className="w-full block aspect-[1/1.618] md:aspect-[4/3] lg:aspect-[16/9] flex flex-col justify-end px-[10%] pb-12 pt-[220px] relative overflow-hidden"
      >
        
        {/* THE RESPONSIVE POSTER LAYER */}
        <picture className="absolute inset-0 w-full h-full z-0 pointer-events-none">
          <source media="(min-width: 1024px)" srcSet={film.hero_wide || film.hero_clsx} />
          <source media="(min-width: 768px)" srcSet={film.hero_clsx || film.hero_wide} />
          
          {/* 🎯 CENTERING EMBED: 
              Adding 'absolute inset-0 w-full h-full object-cover object-center' 
              forces the asset to expand fully to the container bounds without cutting short */}
          <img 
            src={film.hero_tall || film.hero_clsx || film.hero_wide} 
            alt={film.name || "Featured Film Asset"} 
            className="absolute inset-0 w-full h-full object-cover object-center"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.parentElement?.parentElement) {
                e.currentTarget.parentElement.parentElement.style.background = fallbackBg;
              }
            }}
          />
        </picture>

        {/* 🎯 THE 50% HEIGHT GRADIENT INTERFACE LAYER */}
        <div 
          className="absolute inset-x-0 bottom-0 h-1/2 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, #000000BF 0%, #00000000 100%)'
          }}
        />

        {/* DYNAMIC TYPOGRAPHY OVERLAY CONTENT LAYER */}
        <div className="relative z-20 max-w-2xl text-left flex flex-col items-start mt-auto">
          {film.title_art_code ? (
            <div 
              className="mb-4 max-w-[220px] md:max-w-[280px] [&>svg]:w-full [&>svg]:h-auto"
              style={{ color: film.title_art_hex || '#FFFFFF' }}
              dangerouslySetInnerHTML={{ __html: film.title_art_code }}
            />
          ) : (
            film.name && (
              <h1 className="text-[36px] md:text-[52px] font-sans font-black uppercase tracking-tight leading-none text-white mb-4">
                {film.name}
              </h1>
            )
          )}

          {/* METADATA CONTAINER ROW */}
          <div className="flex items-center gap-2.5 font-mono text-[14px] text-white/60 tracking-tight mb-4 select-none">
            {film.rating && (
              <span className="px-1.5 py-0.5 border border-white/40 rounded-[4px] text-white/80 font-bold text-[11px] uppercase">
                {typeof film.rating === 'object' ? film.rating?.name : film.rating}
              </span>
            )}
            <span className="font-semibold text-white/70">{runtimeMinutes}m</span>
          </div>

          {/* TEASER TEXT LAYER */}   
          <p className="font-sans font-medium text-[15px] sm:text-[16px] leading-[1.5em] text-white/80 max-w-md tracking-tight mb-6">
            {film.teaser}
          </p>

          {/* WATCH NOW BUTTON TRIGGER */}
          {isReleased ? (
            <Link 
              href={`/watch/${film.slug || film.id}`} 
              className="h-12 px-7 bg-white text-black font-sans font-bold text-[14px] tracking-tight rounded-full inline-flex items-center justify-center gap-2 hover:bg-white/90 active:scale-95 transition-all duration-150 shadow-2xl"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              <span>Watch {runtimeMinutes}m</span>
            </Link>
          ) : (
            <div className="h-12 px-7 bg-white/10 backdrop-blur-md text-white/40 font-sans font-bold text-[14px] tracking-tight rounded-full inline-flex items-center justify-center gap-2 border border-white/5 select-none">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>Coming Soon</span>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}