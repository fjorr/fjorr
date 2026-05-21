'use client';

import React from 'react';
import Link from 'next/link';

interface SearchItem {
  id: string;
  internal_id: string;
  item_type: 'film' | 'artifact';
  slug: string;
  name: string;
  teaser: string;
  blok_tall: string;
  release_date: string;
  rating?: string;
  theme?: string;
  runtime?: number; 
  label?: string;
  creator?: string; 
}

interface ResultsGridProps {
  results: SearchItem[];
}

export default function SearchResultsGrid({ results }: ResultsGridProps) {
  return (
    <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-12 text-left">
      {results.map((item, index) => {
        const isFilm = item.item_type === 'film';
        const targetHref = isFilm ? `/film/${item.slug}` : `/artifact/${item.slug}`;

        // Future Release Checking Engine
        const isFutureRelease = item.release_date 
          ? new Date(item.release_date).getTime() > Date.now()
          : false;

        const displayYear = item.release_date 
          ? new Date(item.release_date).getFullYear() 
          : null;

        // Convert raw database seconds into ceiling minutes format (e.g. 720s -> 12m)
        const runtimeMinutes = item.runtime 
          ? `${Math.ceil(item.runtime / 60)}m` 
          : null;

        // 🎯 STAGGER WAVE ENGINE: Controls dynamic entrance delays per item card
        const gridStaggerDelay = `${index * 40}ms`;

        return (
          <Link 
            key={item.id} 
            href={targetHref}
            className="flex flex-col gap-3.5 group cursor-pointer animate-in fade-in zoom-in-95 duration-400 fill-mode-both"
            style={{
              animationDelay: gridStaggerDelay,
            }}
          >
            {/* POSTER CANVAS CONTAINER */}
            <div className="w-full aspect-[2/3] rounded-[8px] border border-white/5 bg-zinc-900/40 overflow-hidden relative shadow-xl group-hover:border-white/10 transition-all duration-300">
              {item.blok_tall ? (
                <img 
                  src={item.blok_tall} 
                  alt={item.name} 
                  className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500 pointer-events-none" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-emerald-500/20 text-emerald-400 font-mono text-[10px] tracking-widest uppercase">
                  [ {item.item_type} ]
                </div>
              )}
            </div>

            {/* TEXT & METADATA CONTENT TRACK BLOCK */}
            <div className="flex flex-col gap-1 pl-0.5">
              {/* Title */}
              <h2 className="font-sans font-black text-base leading-normal text-white transition-opacity group-hover:opacity-80">
                {item.name}
              </h2>

              {/* METADATA ROW INTERPOLATOR */}
              <div className="font-sans font-medium text-[11px] tracking-normal capitalize text-white/40 flex items-center min-h-[16px] truncate">
                {isFilm ? (
                  isFutureRelease ? (
                    <span className="text-[#6db7f8] font-semibold">Film &nbsp;Coming Soon</span>
                  ) : (
                    /* FILM METADATA TRACK */
                    <div className="flex items-center gap-x-1.5 dynamic-meta-row capitalize truncate">
                      <span className="font-extrabold text-white/70">Film</span>
                      {item.theme && <span className="truncate max-w-[90px]">{item.theme}</span>}
                      {runtimeMinutes && <span>{runtimeMinutes}</span>}
                    </div>
                  )
                ) : (
                  /* ARTIFACT METADATA TRACK */
                  <div className="flex items-center gap-x-1.5 capitalize truncate">
                    {item.label && <span className="font-extrabold text-white/70 truncate max-w-[90px]">{item.label}</span>}
                    {item.creator && <span className="truncate max-w-[90px]">{item.creator}</span>}
                    {displayYear && <span>{displayYear}</span>}
                    
                    {/* Fallback if all individual artifact fields return empty */}
                    {!item.label && !item.creator && !displayYear && <span className="text-white/30">Artifact</span>}
                  </div>
                )}
              </div>

              {/* Teaser Paragraph */}
              <p className="font-sans font-medium text-[13px] leading-snug text-white/60 tracking-normal line-clamp-2 mt-0.5">
                {item.teaser || "No contextual reference details configured."}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}