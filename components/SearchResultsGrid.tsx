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
}

interface ResultsGridProps {
  results: SearchItem[];
}

export default function SearchResultsGrid({ results }: ResultsGridProps) {
  return (
    <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-12 text-left">
      {results.map((item) => {
        const targetHref = item.item_type === 'film' 
          ? `/film/${item.internal_id}` 
          : `/artifact/${item.slug}`;

        return (
          <Link 
            key={item.id} 
            href={targetHref}
            className="flex flex-col gap-3.5 group cursor-pointer"
          >
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
              
              <div className="absolute top-3 left-3 flex gap-1.5 pointer-events-none">
                <span className="font-mono text-[9px] font-bold bg-black/60 backdrop-blur-md text-white/80 border border-white/5 px-2 py-0.5 rounded-sm uppercase tracking-wider">
                  Exclusive
                </span>
              </div>
              
              {item.item_type === 'film' && (
                <div className="absolute top-3 right-3 text-white/80 pointer-events-none">
                  <svg className="w-4 h-4 opacity-60 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1 pl-0.5">
              <h2 className="font-sans font-black text-[16px] leading-tight text-white transition-opacity group-hover:opacity-80">
                {item.name}
              </h2>
              <p className="font-sans font-normal text-[13px] leading-snug text-white/50 tracking-tight line-clamp-2">
                {item.teaser || "No contextual reference details configured."}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}