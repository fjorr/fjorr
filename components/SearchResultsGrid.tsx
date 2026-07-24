'use client';

import React, { useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { SearchItem } from '@/components/SearchExperience';
import { useMinimalFilter } from '@/components/MinimalFilterContext';
import {
  filterAndSortSearchItems,
  themesFromSearchItems,
} from '@/lib/filter-search-items';
import SearchNadaView from '@/components/SearchNadaView';

interface ResultsGridProps {
  results: SearchItem[];
  /** Cine browse: posters only — titles live in Mini / search. */
  postersOnly?: boolean;
}

export default function SearchResultsGrid({ results, postersOnly = false }: ResultsGridProps) {
  const { sort, theme, setThemes } = useMinimalFilter();

  useEffect(() => {
    // Cine browse seeds themes from the full catalog; don't overwrite with a filtered subset.
    if (postersOnly) return;
    setThemes(themesFromSearchItems(results));
  }, [results, setThemes, postersOnly]);

  const visibleResults = useMemo(
    () => filterAndSortSearchItems(results, { sort, theme }),
    [results, sort, theme]
  );

  if (visibleResults.length === 0) {
    return (
      <div className="flex w-full justify-center py-6">
        <SearchNadaView />
      </div>
    );
  }

  return (
    <div
      className={`w-full grid grid-cols-2 sm:grid-cols-3 text-left ${
        postersOnly
          ? 'md:grid-cols-5 gap-3 sm:gap-4 md:gap-5'
          : 'md:grid-cols-4 gap-x-6 gap-y-12'
      }`}
    >
      {visibleResults.map((item, index) => {
        const isFilm = item.item_type === 'film';
        const targetHref = isFilm ? `/film/${item.slug}` : `/artifact/${item.slug}`;

        const isFutureRelease = item.release_date
          ? new Date(item.release_date).getTime() > Date.now()
          : false;

        const displayYear = item.release_date
          ? new Date(item.release_date).getFullYear()
          : null;

        const runtimeMinutes = item.runtime
          ? `${Math.ceil(item.runtime / 60)}m`
          : null;

        const gridStaggerDelay = `${index * 40}ms`;

        return (
          <Link
            key={item.id}
            href={targetHref}
            className={`group cursor-pointer animate-in fade-in zoom-in-95 duration-400 fill-mode-both ${
              postersOnly ? 'block' : 'flex flex-col gap-3.5'
            }`}
            style={{
              animationDelay: gridStaggerDelay,
            }}
          >
            <div className="w-full aspect-[2/3] rounded-[8px] border border-white/5 bg-zinc-900/40 overflow-hidden relative shadow-xl group-hover:border-white/10 transition-all duration-300">
              {item.blok_tall ? (
                <Image
                  src={item.blok_tall}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  className="object-cover group-hover:scale-[1.01] transition-transform duration-500 pointer-events-none"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-emerald-500/20 text-emerald-400 font-mono text-[10px] tracking-widest uppercase">
                  [ {item.item_type} ]
                </div>
              )}
            </div>

            {!postersOnly && (
              <div className="flex flex-col gap-1 pl-0.5">
                <h2 className="font-sans font-black text-base leading-normal text-white transition-opacity group-hover:opacity-80">
                  {item.name}
                </h2>

                <div className="font-sans font-medium text-[11px] tracking-normal capitalize text-white/40 flex items-center min-h-[16px] truncate">
                  {isFilm ? (
                    isFutureRelease ? (
                      <span className="text-[#6db7f8] font-semibold">Film &nbsp;Coming Soon</span>
                    ) : (
                      <div className="flex items-center gap-x-1.5 dynamic-meta-row capitalize truncate">
                        <span className="font-extrabold text-white/70">Film</span>
                        {item.theme && <span className="truncate max-w-[90px]">{item.theme}</span>}
                        {runtimeMinutes && <span>{runtimeMinutes}</span>}
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-x-1.5 capitalize truncate">
                      {item.label && (
                        <span className="font-extrabold text-white/70 truncate max-w-[90px]">
                          {item.label}
                        </span>
                      )}
                      {item.creator && (
                        <span className="truncate max-w-[90px]">{item.creator}</span>
                      )}
                      {displayYear && <span>{displayYear}</span>}
                      {!item.label && !item.creator && !displayYear && (
                        <span className="text-white/30">Artifact</span>
                      )}
                    </div>
                  )}
                </div>

                <p className="font-sans font-medium text-[13px] leading-snug text-white/60 tracking-normal line-clamp-2 mt-0.5">
                  {item.teaser || 'No contextual reference details configured.'}
                </p>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
