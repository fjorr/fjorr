'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface ArtifactRailProps {
  title: string;
  artifacts: any[];
}

export default function ArtifactRail({ title, artifacts: rawArtifacts }: ArtifactRailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [showArrows, setShowArrows] = useState(false);
  const [hasEnteredScreen, setHasEnteredScreen] = useState(false);

  const filteredArtifacts = (rawArtifacts || []).filter((item) => {
    const artifact = item?.artifact ? item.artifact : item;
    return artifact && artifact.slug;
  });
  const activeArtifacts = filteredArtifacts;

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
      const width = window.innerWidth;
      if (width < 768) {
        setShowArrows(false);
        return;
      }
      const perPage = width >= 1024 ? 6 : 4;
      setShowArrows(activeArtifacts.length > perPage);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [activeArtifacts.length]);

  const scroll = (direction: 'left' | 'right') => {
    if (!railRef.current) return;
    const { scrollLeft, clientWidth } = railRef.current;
    const target =
      direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
    railRef.current.scrollTo({ left: target, behavior: 'smooth' });
  };

  if (!activeArtifacts || activeArtifacts.length === 0) return null;

  return (
    <section ref={containerRef} className="w-full pb-0 relative group/rail z-20 px-8 md:px-16">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .no-scrollbar::-webkit-scrollbar { display: none !important; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `,
        }}
      />

      <div className="w-full max-w-[1440px] mx-auto relative">
        <div
          className={`w-full flex items-center justify-between mb-4 transition-all duration-800 ease-out transform ${
            hasEnteredScreen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <h3 className="font-sans font-bold text-[18px] text-white/90 tracking-tight capitalize whitespace-nowrap">
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
          className="no-scrollbar w-full flex overflow-x-auto overflow-y-hidden snap-x snap-proximity touch-pan-x gap-4 md:gap-5 lg:gap-6 overscroll-x-contain rounded-[8px]"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
        >
          {activeArtifacts.map((item, index) => {
            const artifact = item?.artifact ? item.artifact : item;
            const cardDelay = `${150 + index * 75}ms`;

            return (
              <Link
                key={artifact.id || artifact.slug || index}
                href={`/artifact/${artifact.slug}`}
                draggable={false}
                className={`shrink-0 snap-start group/card cursor-pointer block transition-all duration-700 ease-out transform
                  w-[calc((100%-2rem)/3)] 
                  md:w-[calc((100%-3.75rem)/4)] 
                  lg:w-[calc((100%-7.5rem)/6)]
                  ${
                    hasEnteredScreen
                      ? 'opacity-100 translate-y-0 scale-100'
                      : 'opacity-0 translate-y-6 scale-[0.98]'
                  }`}
                style={{ transitionDelay: hasEnteredScreen ? cardDelay : '0ms' }}
              >
                <div className="w-full aspect-[2/3] rounded-[8px] bg-zinc-900/40 border border-white/5 overflow-hidden relative transition-all duration-300 group-hover/card:scale-[1.02] shadow-xl flex items-center justify-center">
                  {artifact.blok_tall && (
                    <Image
                      src={artifact.blok_tall}
                      alt={artifact.name}
                      fill
                      sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                      className="object-cover pointer-events-none"
                      draggable={false}
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
