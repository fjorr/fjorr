'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useMinimalFilter } from '@/components/MinimalFilterContext';
import TheaterOpenShell from '@/components/TheaterOpenShell';
import PrefetchLink from '@/components/PrefetchLink';
import SearchNadaView from '@/components/SearchNadaView';
import { themesFromFilms } from '@/lib/filter-search-items';
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

export type MinimalFilm = {
  id: string;
  name: string;
  slug: string;
  teaser: string | null;
  runtime: number | null;
  release_date: string | null;
  story_date: string | null;
  mux_playback_id: string | null;
  rating?: string | null;
  theme?: string | null;
  themeSlug?: string | null;
  blok_tall?: string | null;
};

function formatRuntime(runtime: number | null | undefined) {
  if (!runtime) return null;
  return `${Math.ceil(runtime / 60)}M`;
}

function formatYear(film: MinimalFilm) {
  if (film.story_date) return String(film.story_date);
  if (film.release_date) return String(new Date(film.release_date).getFullYear());
  return null;
}

function isComingSoon(film: MinimalFilm) {
  if (!film.release_date) return false;
  return new Date(film.release_date).getTime() > Date.now();
}

function releaseTime(film: MinimalFilm) {
  if (!film.release_date) return 0;
  return new Date(film.release_date).getTime();
}

function MetaLine({ film }: { film: MinimalFilm }) {
  const t = useTranslations('Film');
  const year = formatYear(film);
  if (isComingSoon(film)) {
    return (
      <p className="font-sans text-[11px] font-medium capitalize tracking-normal text-page-faint">
        {t('comingSoon')}
        {year ? ` · ${year}` : ''}
      </p>
    );
  }

  const parts = [film.rating, film.theme, formatYear(film), formatRuntime(film.runtime)].filter(
    Boolean
  );

  if (parts.length === 0) return null;

  return (
    <p className="font-sans text-[11px] font-medium capitalize tracking-normal text-page-faint">
      {parts.join(' - ')}
    </p>
  );
}

export default function MinimalHomeList({ films }: { films: MinimalFilm[] }) {
  const t = useTranslations('Film');
  const { sort, theme, mix, mixes, setThemes } = useMinimalFilter();
  const watchProgress = useWatchProgressMap();
  const [showTheater, setShowTheater] = useState(false);
  const [selectedFilm, setSelectedFilm] = useState<any>(null);
  const [startAt, setStartAt] = useState<number | undefined>(undefined);

  useEffect(() => {
    setThemes(themesFromFilms(films));
  }, [films, setThemes]);

  const visibleFilms = useMemo(() => {
    let next = [...films];

    if (mix === 'coming-soon') {
      next = next.filter((f) => isComingSoon(f));
    } else if (mix !== 'all') {
      const selected = mixes.find((m) => m.slug === mix);
      if (selected) {
        const idSet = new Set(selected.filmIds);
        next = next.filter((f) => idSet.has(f.id));
      }
    }

    if (theme !== 'all') {
      next = next.filter((f) => (f.themeSlug || f.theme) === theme);
    }

    next.sort((a, b) => {
      if (sort === 'az') return a.name.localeCompare(b.name);
      if (sort === 'runtime') return (b.runtime || 0) - (a.runtime || 0);
      const aSoon = isComingSoon(a);
      const bSoon = isComingSoon(b);
      if (aSoon !== bSoon) return aSoon ? 1 : -1;
      if (aSoon && bSoon) return releaseTime(a) - releaseTime(b);
      return releaseTime(b) - releaseTime(a);
    });

    return next;
  }, [films, mix, mixes, sort, theme]);

  const handlePlay = (film: MinimalFilm) => {
    openTheaterFromFilm({
      film: {
        id: film.id,
        name: film.name,
        slug: film.slug,
        mux_playback_id: film.mux_playback_id,
        runtime: film.runtime,
        story_date: film.story_date,
      },
      setSelectedFilm,
      setStartAt,
      setShowTheater,
    });
  };

  return (
    <>
      {visibleFilms.length === 0 ? (
        <SearchNadaView />
      ) : (
        visibleFilms.map((film) => {
          const comingSoon = isComingSoon(film);
          const resume = !comingSoon ? watchProgress[film.id] : null;

          return (
            <div
              key={film.id}
              className="w-full flex items-center justify-between gap-8 py-4 first:pt-0 last:pb-0"
            >
              <PrefetchLink
                href={`/film/${film.slug}`}
                className="min-w-0 flex-1 max-w-[380px] flex flex-col gap-1 pr-2 group"
              >
                <h2 className="font-sans text-[18px] font-bold tracking-tight text-page leading-tight group-hover:opacity-80 transition-opacity">
                  {film.name}
                </h2>
                {film.teaser && (
                  <p className="font-sans text-[14px] font-normal text-page-muted leading-snug line-clamp-2">
                    {film.teaser}
                  </p>
                )}
                <MetaLine film={film} />
              </PrefetchLink>

              <div className="shrink-0 flex items-center justify-end gap-2">
                {!comingSoon && (
                  <button
                    type="button"
                    onClick={() => handlePlay(film)}
                    className="h-8 px-3 rounded-[6px] bg-page-chip-active font-sans text-[13px] font-semibold text-page hover:bg-page-chip-hover transition-colors whitespace-nowrap"
                  >
                    {resume
                      ? t('resume', { time: formatResumeClock(resume.seconds) })
                      : t('playShort')}
                  </button>
                )}
              </div>
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
    </>
  );
}
