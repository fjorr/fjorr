'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import HeroPicture from '@/components/HeroPicture';
import { sanitizeTitleArtSvg } from '@/lib/sanitize-svg';

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

const RAIL_SCROLLBAR_CSS = `
  .fjorr-feature-scroll::-webkit-scrollbar { display: none !important; }
  .fjorr-feature-scroll {
    -ms-overflow-style: none;
    scrollbar-width: none;
    overflow-x: scroll;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-x;
    overscroll-behavior-x: contain;
  }
`;

export default function FeatureRail({
  films,
  activeIndex,
  onSlideChange,
  onPlayClick,
  isTheaterActive = false,
}: FeatureRailProps) {
  const t = useTranslations('Film');
  const fallbackBg = 'linear-gradient(to bottom, #4C7A57, #36593E)';
  const railRef = useRef<HTMLDivElement>(null);
  const ignoreScrollSync = useRef(false);

  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const AUTOPLAY_DELAY = 5000;
  const TICK_RATE = 100;

  const RADIUS = 18.75;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const strokeDashoffset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    const el = railRef.current;
    if (!el) return;
    ignoreScrollSync.current = true;
    el.scrollTo({ left: index * el.clientWidth, behavior });
    window.setTimeout(() => {
      ignoreScrollSync.current = false;
    }, behavior === 'smooth' ? 450 : 50);
  }, []);

  const goTo = useCallback(
    (index: number) => {
      const next = ((index % films.length) + films.length) % films.length;
      onSlideChange(next);
      scrollToIndex(next);
    },
    [films.length, onSlideChange, scrollToIndex]
  );

  // Keep scroll position in sync when parent index changes (e.g. after theater).
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const expected = activeIndex * el.clientWidth;
    if (Math.abs(el.scrollLeft - expected) > 2) {
      scrollToIndex(activeIndex, 'auto');
    }
  }, [activeIndex, scrollToIndex]);

  // Native swipe → update active index from scroll position.
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;

    let timeout: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      if (ignoreScrollSync.current) return;
      window.clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (!railRef.current) return;
        const width = railRef.current.clientWidth || 1;
        const i = Math.round(railRef.current.scrollLeft / width);
        const clamped = Math.max(0, Math.min(films.length - 1, i));
        if (clamped !== activeIndex) onSlideChange(clamped);
      }, 40);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.clearTimeout(timeout);
    };
  }, [activeIndex, films.length, onSlideChange]);

  useEffect(() => {
    if (!isPlaying || isTheaterActive || films.length < 2) return;

    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          const nextTarget = activeIndex === films.length - 1 ? 0 : activeIndex + 1;
          setTimeout(() => goTo(nextTarget), 0);
          return 0;
        }
        return prevProgress + (TICK_RATE / AUTOPLAY_DELAY) * 100;
      });
    }, TICK_RATE);

    return () => clearInterval(timer);
  }, [isPlaying, activeIndex, films.length, goTo, isTheaterActive]);

  useEffect(() => {
    setProgress(0);
  }, [activeIndex]);

  if (!films || films.length === 0) return null;

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  const getSponsorName = (film: FilmAsset) => {
    if (film.sponsor?.name) return film.sponsor.name;
    if (typeof film.sponsor === 'string') return film.sponsor;
    if (film.sponsor_id === '0afb5b63-1e90-4a37-824d-33cc41afde3d') return 'Mercedes-Benz';
    return null;
  };

  const getRuntimeDisplay = (film: FilmAsset) => {
    const rawSeconds = film.runtime || 0;
    const finalValue = Math.ceil(rawSeconds / 60);
    return finalValue === 0 ? '1m' : `${finalValue}m`;
  };

  return (
    <section className="w-full flex justify-center bg-[#1F1F1F]">
      <style dangerouslySetInnerHTML={{ __html: RAIL_SCROLLBAR_CSS }} />

      {/* Avoid overflow-hidden here — it breaks nested horizontal swipe on iOS Safari. */}
      <div className="w-full max-w-[1440px] relative group/rail rounded-none min-[1440px]:rounded-xl">
        <div
          ref={railRef}
          className="fjorr-feature-scroll flex w-full min-w-0 snap-x snap-mandatory"
        >
          {films.map((film, index) => {
            const sponsorName = getSponsorName(film);
            const baselineWidth = 300;
            const currentScale = film.title_art_scale || 1.0;
            const calculatedWidth = `${baselineWidth * currentScale}px`;
            const titleArtSvg = sanitizeTitleArtSvg(film.title_art_code);

            return (
              <article
                key={film.id || index}
                className="relative w-full min-w-full shrink-0 snap-center snap-always aspect-[1/1.618] md:aspect-[4/3] lg:aspect-[16/9] select-none"
              >
                <Link
                  href={`/film/${film.slug || ''}`}
                  className="absolute inset-0 w-full h-full block z-0 cursor-pointer"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0) 100%)',
                  }}
                  draggable={false}
                >
                  <HeroPicture
                    wide={film.hero_wide}
                    clsx={film.hero_clsx}
                    tall={film.hero_tall}
                    alt={film.name || 'Featured Film Asset'}
                    priority={index === 0}
                    className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none group-hover/rail:scale-[1.01] transition-transform duration-700"
                    imgClassName="object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const link = e.currentTarget.closest('a');
                      if (link instanceof HTMLElement) {
                        link.style.background = fallbackBg;
                      }
                    }}
                  />

                  <div
                    className="absolute inset-x-0 bottom-0 h-1/2 z-10 pointer-events-none"
                    style={{ background: 'linear-gradient(to top, #000000BF 0%, #00000000 100%)' }}
                  />
                </Link>

                <div className="absolute inset-x-0 bottom-0 px-8 md:px-12 pb-14 md:pb-16 pt-16 md:pt-32 z-20 max-w-2xl w-full flex flex-col text-center md:text-left items-center md:items-start mx-auto md:mx-0 pointer-events-none">
                  {sponsorName && (
                    <div className="w-full font-sans font-bold text-[13px] text-white/90 tracking-wide mb-2.5 antialiased">
                      {sponsorName} <span className="font-medium text-white/70">{t('presents')}</span>
                    </div>
                  )}

                  {titleArtSvg ? (
                    <div
                      className="mb-4 w-full max-w-[240px] md:max-w-[380px] flex items-center justify-center md:justify-start [&>svg]:w-full [&>svg]:h-auto"
                      style={
                        {
                          color: film.title_art_hex || '#FFFFFF',
                          '--desktop-width': calculatedWidth,
                        } as React.CSSProperties
                      }
                    >
                      <div
                        className="w-full md:w-[var(--desktop-width)]"
                        dangerouslySetInnerHTML={{ __html: titleArtSvg }}
                      />
                    </div>
                  ) : (
                    film.name && (
                      <h2 className="text-[28px] md:text-[36px] font-sans font-black uppercase tracking-tight leading-none text-white mb-3">
                        {film.name}
                      </h2>
                    )
                  )}

                  <div className="flex items-center justify-center md:justify-start gap-2.5 font-sans text-sm text-white/40 tracking-normal mb-2 select-none">
                    {(() => {
                      const ratingVal =
                        typeof film.rating === 'object' ? film.rating?.name : film.rating;
                      if (!ratingVal) return null;
                      return (
                        <span className="px-1 py-0.25 border border-white/60 rounded-[4px] text-white/60 font-semibold text-[12px] uppercase">
                          {ratingVal}
                        </span>
                      );
                    })()}

                    {(() => {
                      const themeVal =
                        typeof film.theme === 'object' ? film.theme?.name : film.theme;
                      if (!themeVal) return null;
                      return (
                        <span className="capitalize font-medium text-white/60">{themeVal}</span>
                      );
                    })()}

                    {(() => {
                      const storyDateVal =
                        typeof film.story_date === 'object'
                          ? film.story_date?.name
                          : film.story_date;
                      if (!storyDateVal) return null;
                      return <span className="text-white/60 font-medium">{storyDateVal}</span>;
                    })()}
                  </div>

                  <p className="font-sans font-medium text-sm leading-[1.4em] text-white/80 max-w-xs md:max-w-xs tracking-normal mb-6">
                    {film.teaser}
                  </p>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onPlayClick(film);
                    }}
                    className="h-10 px-6 inline-flex items-center justify-center gap-2 bg-white hover:bg-white/90 text-black font-sans font-bold text-sm tracking-normal rounded-full transition-all active:scale-[0.98] duration-150 shadow-lg pointer-events-auto cursor-pointer border-0 outline-none"
                  >
                    <img
                      src="/icons/play.svg"
                      className="w-4 h-4 select-none object-contain translate-y-[0.5px]"
                      alt=""
                    />
                    <span>{t('play', { runtime: getRuntimeDisplay(film) })}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="absolute inset-x-0 bottom-8 z-30 flex items-center justify-center pointer-events-none px-8 md:px-12">
          <div className="flex items-center justify-center gap-2 pointer-events-auto mx-auto">
            {films.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  goTo(index);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  index === activeIndex ? 'bg-white scale-125' : 'bg-white/25 hover:bg-white/50'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <div className="absolute right-6 md:right-12 flex items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={handleTogglePlay}
              className="w-10 h-10 relative rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200 active:scale-95 bg-white/10 hover:bg-white/20 border border-white/10 overflow-hidden transform-gpu"
              aria-label={isPlaying ? 'Pause autoplay loop' : 'Start autoplay loop'}
            >
              <svg
                className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none"
                viewBox="0 0 40 40"
              >
                <circle
                  cx="20"
                  cy="20"
                  r={RADIUS}
                  fill="transparent"
                  stroke="rgba(255, 255, 255, 0.15)"
                  strokeWidth="2.5"
                />
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
                    <div className="w-1 h-3 bg-white rounded-full" />
                    <div className="w-1 h-3 bg-white rounded-full" />
                  </div>
                ) : (
                  <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor" className="translate-x-[1px]">
                    <path d="M2 1.5V12.5L11 7L2 1.5Z" />
                  </svg>
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goTo(activeIndex - 1);
              }}
              className="hidden md:flex w-10 h-10 rounded-full bg-white/10 text-white items-center justify-center backdrop-blur-sm hover:bg-white/20 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <svg
                width="6"
                height="10"
                viewBox="0 0 6 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="rotate-180"
              >
                <polyline points="1.5 8.5 5 5 1.5 1.5" />
              </svg>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goTo(activeIndex + 1);
              }}
              className="hidden md:flex w-10 h-10 rounded-full bg-white/10 text-white items-center justify-center backdrop-blur-sm hover:bg-white/20 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <svg
                width="6"
                height="10"
                viewBox="0 0 6 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="1.5 8.5 5 5 1.5 1.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
