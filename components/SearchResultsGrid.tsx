'use client';

import React, { useEffect, useMemo } from 'react';
import Image from 'next/image';
import PrefetchLink from '@/components/PrefetchLink';
import { useTranslations } from 'next-intl';
import type { SearchItem } from '@/components/SearchExperience';
import { useMinimalFilter } from '@/components/MinimalFilterContext';
import {
  filterAndSortSearchItems,
  themesFromSearchItems,
} from '@/lib/filter-search-items';
import SearchNadaView from '@/components/SearchNadaView';
import SearchMatchLine from '@/components/SearchMatchLine';
import { useWatchProgressMap } from '@/components/useWatchProgress';
import { formatResumeClock } from '@/lib/watch-progress';

interface ResultsGridProps {
  results: SearchItem[];
  /** Cine browse: posters only — titles live in Mini / search. */
  postersOnly?: boolean;
}

/** Always dark glass — badges sit on posters regardless of site theme. */
const glassBadgeStyle: React.CSSProperties = {
  backgroundColor: 'color-mix(in srgb, #1F1F1F 72%, transparent)',
  backdropFilter: 'blur(24px) saturate(1.4)',
  WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
  transform: 'translateZ(0)',
};

export default function SearchResultsGrid({ results, postersOnly = false }: ResultsGridProps) {
  const t = useTranslations('Film');
  const tSearch = useTranslations('Search');
  const { sort, theme, mix, mixes, setThemes } = useMinimalFilter();
  const watchProgress = useWatchProgressMap();

  useEffect(() => {
    // Cine browse seeds themes from the full catalog; don't overwrite with a filtered subset.
    if (postersOnly) return;
    setThemes(themesFromSearchItems(results));
  }, [results, setThemes, postersOnly]);

  const visibleResults = useMemo(
    () =>
      // Cine browse already applies mix upstream; search results need it here.
      postersOnly
        ? filterAndSortSearchItems(results, { sort, theme })
        : filterAndSortSearchItems(results, { sort, theme, mix, mixes }),
    [mix, mixes, postersOnly, results, sort, theme]
  );

  if (visibleResults.length === 0) {
    return <SearchNadaView />;
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

        const resume = isFilm && !isFutureRelease ? watchProgress[item.id] : null;

        const displayYear = item.release_date
          ? new Date(item.release_date).getFullYear()
          : null;

        const runtimeMinutes = item.runtime
          ? `${Math.ceil(item.runtime / 60)}m`
          : null;

        const gridStaggerDelay = `${index * 40}ms`;

        return (
          <PrefetchLink
            key={item.id}
            href={targetHref}
            className={`group cursor-pointer animate-in fade-in zoom-in-95 duration-400 fill-mode-both ${
              postersOnly ? 'block' : 'flex flex-col gap-3.5'
            }`}
            style={{
              animationDelay: gridStaggerDelay,
            }}
          >
            <div className="w-full aspect-[2/3] rounded-[8px] border-0 dark:border dark:border-white/5 bg-zinc-900/40 overflow-hidden relative shadow-xl dark:group-hover:border-white/10 transition-all duration-300">
              {item.blok_tall ? (
                <Image
                  src={item.blok_tall}
                  alt={item.name}
                  fill
                  sizes={
                    postersOnly
                      ? '(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 20vw, 18vw'
                      : '(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw'
                  }
                  priority={index < 2}
                  fetchPriority={index < 2 ? 'high' : 'auto'}
                  className="object-cover group-hover:scale-[1.01] transition-transform duration-500 pointer-events-none"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-emerald-500/20 text-emerald-400 font-mono text-[10px] tracking-widest uppercase">
                  [ {item.item_type} ]
                </div>
              )}
              {isFilm && isFutureRelease && (
                <span
                  className="absolute left-2 bottom-2 z-10 max-w-[calc(100%-1rem)] truncate rounded-[6px] border border-white/10 px-2 py-1 font-sans text-[10px] font-semibold capitalize tracking-normal text-white/90 shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
                  style={glassBadgeStyle}
                >
                  {t('comingSoon')}
                </span>
              )}
              {resume && (
                <span
                  className="absolute left-2 bottom-2 z-10 max-w-[calc(100%-1rem)] truncate rounded-[6px] border border-white/10 px-2 py-1 font-sans text-[10px] font-semibold capitalize tracking-normal text-white/90 shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
                  style={glassBadgeStyle}
                >
                  {t('resume', { time: formatResumeClock(resume.seconds) })}
                </span>
              )}
            </div>

            {!postersOnly && (
              <div className="flex flex-col gap-1 pl-0.5">
                <h2 className="font-sans font-black text-base leading-normal text-page transition-opacity group-hover:opacity-80">
                  {item.name}
                </h2>

                <div className="font-sans font-medium text-[11px] tracking-normal capitalize text-page-faint flex items-center min-h-[16px] truncate">
                  {isFilm ? (
                    isFutureRelease ? (
                      <span className="text-[#6db7f8] font-semibold">{tSearch('filmComingSoon')}</span>
                    ) : (
                      <div className="flex items-center gap-x-1.5 dynamic-meta-row capitalize truncate">
                        <span className="font-extrabold text-page-muted">{tSearch('film')}</span>
                        {item.theme && <span className="truncate max-w-[90px]">{item.theme}</span>}
                        {runtimeMinutes && <span>{runtimeMinutes}</span>}
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-x-1.5 capitalize truncate">
                      {item.label && (
                        <span className="font-extrabold text-page-muted truncate max-w-[90px]">
                          {item.label}
                        </span>
                      )}
                      {item.creator && (
                        <span className="truncate max-w-[90px]">{item.creator}</span>
                      )}
                      {displayYear && <span>{displayYear}</span>}
                      {!item.label && !item.creator && !displayYear && (
                        <span className="text-page-faint">{tSearch('artifact')}</span>
                      )}
                    </div>
                  )}
                </div>

                <p className="font-sans font-medium text-[13px] leading-snug text-page-muted tracking-normal line-clamp-2 mt-0.5">
                  {item.teaser || tSearch('noTeaser')}
                </p>
                <SearchMatchLine item={item} className="mt-0.5" />
              </div>
            )}
          </PrefetchLink>
        );
      })}
    </div>
  );
}
