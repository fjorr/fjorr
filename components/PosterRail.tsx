'use client';

import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export type PosterRailItem = {
  key: string;
  href: string;
  image?: string | null;
  label?: string | null;
};

type PosterRailProps = {
  title: string;
  items: PosterRailItem[];
};

const RAIL_CSS = `
  .fjorr-poster-rail::-webkit-scrollbar { display: none !important; }
  .fjorr-poster-rail {
    -ms-overflow-style: none;
    scrollbar-width: none;
    /* iOS: scroll (not auto) + touch-action so horizontal pans aren't stolen by the page */
    overflow-x: scroll;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-x;
    overscroll-behavior-x: contain;
  }
  .fjorr-poster-rail a {
    touch-action: pan-x;
    -webkit-user-drag: none;
  }
`;

/**
 * Full-bleed poster rail.
 * Left inset is measured from the title so the first card stays locked under
 * the headline at scrollLeft=0.
 */
export default function PosterRail({ title, items }: PosterRailProps) {
  const containerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const insetRef = useRef(32);
  const [inset, setInset] = useState(32);
  const [showArrows, setShowArrows] = useState(false);
  const [hasEnteredScreen, setHasEnteredScreen] = useState(false);

  useLayoutEffect(() => {
    let isFirstSync = true;
    const syncInset = () => {
      const titleEl = titleRef.current;
      const railEl = railRef.current;
      if (!titleEl || !railEl) return;
      const next = Math.max(
        0,
        Math.round(titleEl.getBoundingClientRect().left - railEl.getBoundingClientRect().left)
      );
      // Ignore 1px jitter from iOS URL-bar resize so we don't re-render mid-swipe.
      if (Math.abs(next - insetRef.current) < 2 && !isFirstSync) return;
      insetRef.current = next;
      setInset(next);
      if (isFirstSync) {
        railEl.scrollLeft = 0;
        isFirstSync = false;
      }
    };

    syncInset();
    window.addEventListener('resize', syncInset);
    const ro = new ResizeObserver(syncInset);
    if (railRef.current) ro.observe(railRef.current);
    return () => {
      window.removeEventListener('resize', syncInset);
      ro.disconnect();
    };
  }, [items.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEnteredScreen(true);
          if (containerRef.current) observer.unobserve(containerRef.current);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 768) {
        setShowArrows(false);
        return;
      }
      const el = railRef.current;
      setShowArrows(Boolean(el && el.scrollWidth > el.clientWidth + 8));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [items.length, inset]);

  const scroll = (direction: 'left' | 'right') => {
    if (!railRef.current) return;
    const amount = Math.round(railRef.current.clientWidth * 0.85);
    railRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  if (items.length === 0) return null;

  return (
    <section ref={containerRef} className="w-full max-w-full min-w-0 pb-0 relative group/rail z-20">
      <style dangerouslySetInnerHTML={{ __html: RAIL_CSS }} />

      <div
        className={`w-full max-w-[1440px] mx-auto flex items-center justify-between mb-4 px-8 md:px-16 transition-opacity duration-800 ease-out ${
          hasEnteredScreen ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <h3
          ref={titleRef}
          className="font-sans font-bold text-[18px] text-white/90 tracking-tight capitalize whitespace-nowrap"
        >
          {title}
        </h3>

        {showArrows && (
          <div className="flex items-center gap-1.5 select-none">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/80 transition-all duration-200 text-[16px] font-sans font-bold cursor-pointer pb-0.5"
            >
              &lsaquo;
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/80 transition-all duration-200 text-[16px] font-sans font-bold cursor-pointer pb-0.5"
            >
              &rsaquo;
            </button>
          </div>
        )}
      </div>

      <div
        ref={railRef}
        className="fjorr-poster-rail flex w-full max-w-full min-w-0 pb-1"
      >
        <div className="shrink-0" style={{ width: inset }} aria-hidden />

        {items.map((item, index) => {
          const delay = `${150 + index * 75}ms`;

          return (
            <Link
              key={item.key}
              href={item.href}
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              className={`shrink-0 group/card block mr-3 sm:mr-4 md:mr-5 lg:mr-6 transition-opacity duration-700 ease-out
                w-[42vw] max-w-[200px]
                sm:w-[28vw] sm:max-w-none
                md:w-[22vw] md:max-w-[220px]
                lg:w-[14vw] lg:max-w-[240px]
                ${hasEnteredScreen ? 'opacity-100' : 'opacity-0'}`}
              style={{ transitionDelay: hasEnteredScreen ? delay : '0ms' }}
            >
              <div className="w-full aspect-[2/3] rounded-[8px] bg-zinc-900/40 border border-white/5 overflow-hidden relative shadow-xl flex items-center justify-center [@media(hover:hover)_and_(pointer:fine)]:transition-transform [@media(hover:hover)_and_(pointer:fine)]:duration-300 [@media(hover:hover)_and_(pointer:fine)]:group-hover/card:scale-[1.02]">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.label || 'Poster'}
                    fill
                    sizes="(max-width: 640px) 42vw, (max-width: 768px) 28vw, (max-width: 1024px) 22vw, 14vw"
                    className="object-cover pointer-events-none select-none"
                    draggable={false}
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center p-4 text-center text-white/30 font-sans font-medium text-[11px]"
                    style={{ background: 'linear-gradient(to bottom, #1C1C1E, #0A0A0C)' }}
                  >
                    {item.label}
                  </div>
                )}
              </div>
            </Link>
          );
        })}

        <div className="shrink-0 w-1 md:w-2" aria-hidden />
      </div>
    </section>
  );
}
