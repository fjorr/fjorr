'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import type { SearchItem } from '@/components/SearchExperience';
import { useMinimalFilter } from '@/components/MinimalFilterContext';
import PrefetchLink from '@/components/PrefetchLink';
import TheaterOpenShell from '@/components/TheaterOpenShell';
import {
  filterAndSortSearchItems,
  themesFromSearchItems,
} from '@/lib/filter-search-items';
import SearchNadaView from '@/components/SearchNadaView';
import {
  clearWatchProgress,
  trackWatchProgress,
  formatResumeClock,
} from '@/lib/watch-progress';
import { useWatchProgressMap } from '@/components/useWatchProgress';
import { openTheaterFromFilm } from '@/lib/theater-open';

const CinemaTheater = dynamic(() => import('@/components/CinemaTheater'), {
  ssr: false,
  loading: () => <TheaterOpenShell />,
});

function formatRuntime(runtime: number | null | undefined) {
  if (!runtime) return null;
  return `${Math.ceil(runtime / 60)}M`;
}

function isComingSoon(releaseDate?: string | null) {
  if (!releaseDate) return false;
  return new Date(releaseDate).getTime() > Date.now();
}

function MetaLine({ item }: { item: SearchItem }) {
  const t = useTranslations('Film');
  const comingSoon = isComingSoon(item.release_date);

  if (item.item_type === 'film' && comingSoon) {
    return (
      <p className="font-sans text-[11px] font-medium capitalize tracking-normal text-white/30">
        {t('comingSoon')}
      </p>
    );
  }

  const year = item.release_date
    ? String(new Date(item.release_date).getFullYear())
    : null;

  const parts =
    item.item_type === 'film'
      ? [item.rating, item.theme, year, formatRuntime(item.runtime)].filter(Boolean)
      : [item.label, item.creator, year].filter(Boolean);

  if (parts.length === 0) {
    return (
      <p className="font-sans text-[11px] font-medium capitalize tracking-normal text-white/30">
        {item.item_type === 'film' ? 'Film' : 'Artifact'}
      </p>
    );
  }

  return (
    <p className="font-sans text-[11px] font-medium capitalize tracking-normal text-white/30">
      {parts.join(' - ')}
    </p>
  );
}

export default function SearchResultsMinimal({ results }: { results: SearchItem[] }) {
  const t = useTranslations('Film');
  const { sort, theme, mix, mixes, setThemes } = useMinimalFilter();
  const watchProgress = useWatchProgressMap();
  const [showTheater, setShowTheater] = useState(false);
  const [selectedFilm, setSelectedFilm] = useState<any>(null);
  const [startAt, setStartAt] = useState<number | undefined>(undefined);

  useEffect(() => {
    setThemes(themesFromSearchItems(results));
  }, [results, setThemes]);

  const visibleResults = useMemo(
    () => filterAndSortSearchItems(results, { sort, theme, mix, mixes }),
    [mix, mixes, results, sort, theme]
  );

  const handlePlay = (item: SearchItem) => {
    if (item.item_type !== 'film' || isComingSoon(item.release_date)) return;
    openTheaterFromFilm({
      film: {
        id: item.internal_id || item.id,
        name: item.name,
        slug: item.slug,
        runtime: item.runtime ?? null,
      },
      setSelectedFilm,
      setStartAt,
      setShowTheater,
    });
  };

  return (
    <div className="w-full max-w-[600px] mx-auto flex flex-col divide-y divide-white/[0.06]">
      {visibleResults.length === 0 ? (
        <div className="flex w-full justify-center py-6">
          <SearchNadaView />
        </div>
      ) : (
        visibleResults.map((item) => {
          const isFilm = item.item_type === 'film';
          const comingSoon = isFilm && isComingSoon(item.release_date);
          const infoHref = isFilm ? `/film/${item.slug}` : `/artifact/${item.slug}`;
          const canPlay = isFilm && !comingSoon;
          const filmId = item.internal_id || item.id;
          const resume = canPlay
            ? watchProgress[filmId] || watchProgress[item.id] || null
            : null;

          return (
            <div
              key={item.id}
              className="w-full flex items-center justify-between gap-8 py-4 first:pt-0 last:pb-0"
            >
              <PrefetchLink
                href={infoHref}
                className={`min-w-0 flex-1 flex flex-col gap-1 group ${
                  isFilm
                    ? 'max-w-[380px] pr-2'
                    : 'max-w-none sm:max-w-[380px]'
                }`}
              >
                <h2 className="font-sans text-[18px] font-bold tracking-tight text-white leading-tight group-hover:text-white/85 transition-colors">
                  {item.name}
                </h2>
                {item.teaser && (
                  <p className="font-sans text-[14px] font-normal text-white/70 leading-snug line-clamp-2">
                    {item.teaser}
                  </p>
                )}
                <MetaLine item={item} />
              </PrefetchLink>

              {isFilm ? (
                <div className="shrink-0 flex items-center justify-end gap-2">
                  {canPlay && (
                    <button
                      type="button"
                      onClick={() => handlePlay(item)}
                      className="h-8 px-3 rounded-[6px] bg-white/15 font-sans text-[13px] font-semibold text-white hover:bg-white/25 transition-colors whitespace-nowrap"
                    >
                      {resume
                        ? t('resume', { time: formatResumeClock(resume.seconds) })
                        : t('playShort')}
                    </button>
                  )}
                  <PrefetchLink
                    href={infoHref}
                    className="h-8 px-3 rounded-[6px] bg-white/5 font-sans text-[13px] font-semibold text-white/55 hover:text-white/80 hover:bg-white/10 transition-colors inline-flex items-center"
                  >
                    {t('info')}
                  </PrefetchLink>
                </div>
              ) : (
                <div className="hidden sm:block shrink-0 w-[132px]" aria-hidden />
              )}
            </div>
          );
        })
      )}

      {showTheater && selectedFilm && (
        <CinemaTheater
          film={selectedFilm}
          startAt={startAt}
          onTimeUpdate={(seconds) => {
            if (!selectedFilm?.id || !selectedFilm?.slug) return;
            trackWatchProgress({
              filmId: selectedFilm.id,
              slug: selectedFilm.slug,
              seconds,
              duration: selectedFilm.runtime,
            });
          }}
          onEnded={() => {
            if (selectedFilm?.id) clearWatchProgress(selectedFilm.id);
          }}
          onClose={() => {
            setShowTheater(false);
            setSelectedFilm(null);
            setStartAt(undefined);
          }}
        />
      )}
    </div>
  );
}
