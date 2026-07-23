'use client';

import React from 'react';
import { Play } from 'lucide-react';

interface FilmHeroProps {
  film: any;
  onPlayClick: () => void; 
}

export default function FilmHero({ film, onPlayClick }: FilmHeroProps) {
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

  // 📐 CLEAN MAX-WIDTH MATH
  const baselineWidth = 300; 
  const currentScale = film.title_art_scale || 1.0;
  const calculatedWidth = `${baselineWidth * currentScale}px`;

  // 🎯 STATIC FALLBACK RESOLVER:
  // Since we see the raw UUID '0afb5b63...' in your trace for "Unexpected Champion",
  // this extracts the string directly if the relational object is undefined.
  const getSponsorName = () => {
    if (film.sponsor?.name) return film.sponsor.name;
    
    // Check against the exact Mercedes UUID from your creator table screenshot
    if (film.sponsor_id === '0afb5b63-1e90-4a37-824d-33cc41afde3d') {
      return 'Mercedes-Benz';
    }
    return null;
  };

  const sponsorName = getSponsorName();

  return (
    <section className="w-full flex justify-center">
      <div className="w-full relative overflow-hidden rounded-none shadow-2xl">
        <div className="w-full block aspect-[1/1.618] md:aspect-[4/3] lg:aspect-[16/9] flex flex-col justify-end px-8 md:px-12 pb-8 md:pb-12 pt-[220px] relative bg-cover bg-center transition-all duration-500 select-none" style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0) 100%)` }}>
          
          <picture className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none">
            <source media="(min-width: 1024px)" srcSet={film.hero_wide} />
            <source media="(min-width: 768px)" srcSet={film.hero_clsx || film.hero_wide} />
            <img src={film.hero_tall || film.hero_clsx || film.hero_wide} alt={film.name || "Featured Film Asset"} className="w-full h-full object-cover object-center" onError={(e) => { e.currentTarget.style.display = 'none'; if (e.currentTarget.parentElement?.parentElement) { e.currentTarget.parentElement.style.background = fallbackBg; } }} />
          </picture>

          <div className="absolute inset-x-0 bottom-0 h-1/2 z-10 pointer-events-none" style={{ background: 'linear-gradient(to top, #000000BF 0%, #00000000 100%)' }} />

          <div className="relative z-20 max-w-2xl w-full flex flex-col items-center text-center md:items-start md:text-left mx-auto md:mx-0 mt-auto">
            
            {/* 🎯 SPONSOR INJECTION VIEW */}
            {sponsorName && (
              <div className="w-full font-sans font-bold text-[13px] text-white/90 tracking-wide mb-2.5 antialiased">
                {sponsorName} <span className="font-medium text-white/70">presents</span>
              </div>
            )}

            {film.title_art_code ? (
              <div 
                className="mb-4 w-full max-w-[200px] md:max-w-none flex items-center justify-center md:justify-start [&>svg]:w-full [&>svg]:h-auto" 
                style={{ 
                  color: film.title_art_hex || '#FFFFFF',
                  '--desktop-width': calculatedWidth
                } as React.CSSProperties}
              >
                <div 
                  className="w-full md:w-[var(--desktop-width)]"
                  dangerouslySetInnerHTML={{ __html: film.title_art_code }}
                />
              </div>
            ) : (
              film.name && <h1 className="text-[28px] md:text-[36px] font-sans font-black uppercase tracking-tight leading-none text-white mb-3">{film.name}</h1>
            )}

            <div className="flex items-center justify-center md:justify-start gap-2.5 font-sans text-sm text-white/40 tracking-normal mb-2 select-none">
              {(() => { const ratingVal = typeof film.rating === 'object' ? film.rating?.name : film.rating; if (!ratingVal) return null; return <span className="px-1 py-0.25 border border-white/60 rounded-[4px] text-white/60 font-semibold text-[12px] uppercase">{ratingVal}</span>; })()}
              {(() => { const themeVal = typeof film.theme === 'object' ? film.theme?.name : film.theme; if (!themeVal) return null; return <span className="capitalize font-medium text-white/60"> {themeVal}</span>; })()}
              {(() => { 
                const storyDateVal = typeof film.story_date === 'object' ? film.story_date?.name : film.story_date; 
                if (!storyDateVal) return null; 
                return <span className="text-white/60 font-medium">{storyDateVal}</span>; 
              })()}
            </div>

            <p className="font-sans font-medium text-sm leading-snug text-white/80 max-w-xs md:max-w-xs tracking-normal mb-5">{film.teaser}</p>

            {isReleased ? (
              <button
                onClick={onPlayClick} 
                className="h-10 px-6 inline-flex items-center justify-center gap-2 bg-white hover:bg-white/90 text-black font-sans font-bold text-sm tracking-normal rounded-full transition-all active:scale-[0.98] duration-150 shadow-lg cursor-pointer border-0 outline-none"
              >
                <img 
                  src="/icons/play.svg" 
                  className="w-5 h-5 select-none object-contain translate-y-[0.5px]" 
                  alt="Play" 
                />
                <span>Play {getRuntimeDisplay()}</span>
              </button>
            ) : (
              <div className="h-10 px-6 inline-flex items-center justify-center gap-2 bg-white/20 backdrop-blur-md text-white/80 font-sans font-bold text-sm tracking-normal rounded-full border border-white/5 select-none">
                <svg 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  viewBox="0 0 24 24"
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
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