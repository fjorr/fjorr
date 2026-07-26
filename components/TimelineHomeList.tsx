'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useMinimalFilter } from '@/components/MinimalFilterContext';
import TimelineRail, { type TimelineRailItem } from '@/components/TimelineRail';
import TheaterOpenShell from '@/components/TheaterOpenShell';
import type { MinimalFilm } from '@/components/MinimalHomeList';
import type { MinimalArtifact } from '@/components/MinimalArtifactList';
import { themesFromFilms } from '@/lib/filter-search-items';
import {
  clearWatchProgress,
  trackWatchProgress,
} from '@/lib/watch-progress';
import { openTheaterFromFilm } from '@/lib/theater-open';

const CinemaTheater = dynamic(() => import('@/components/CinemaTheater'), {
  ssr: false,
  loading: () => <TheaterOpenShell />,
});

function isComingSoon(releaseDate: string | null | undefined) {
  if (!releaseDate) return false;
  return new Date(releaseDate).getTime() > Date.now();
}

function releaseYearString(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const year = new Date(iso).getFullYear();
  return Number.isFinite(year) ? String(year) : null;
}

/**
 * Home Time browse — films by story year, artifacts by release year.
 */
export default function TimelineHomeList({
  films,
  artifacts,
}: {
  films: MinimalFilm[];
  artifacts: MinimalArtifact[];
}) {
  const { theme, mix, mixes, setThemes, contentType } = useMinimalFilter();
  const showingArtifacts = contentType === 'artifact';
  const [showTheater, setShowTheater] = useState(false);
  const [selectedFilm, setSelectedFilm] = useState<any>(null);
  const [startAt, setStartAt] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (showingArtifacts) {
      setThemes([]);
      return;
    }
    setThemes(themesFromFilms(films));
  }, [films, showingArtifacts, setThemes]);

  const items = useMemo((): TimelineRailItem[] => {
    if (showingArtifacts) {
      return artifacts.map((a) => ({
        id: a.id,
        name: a.name,
        teaser: a.teaser,
        href: `/artifact/${a.slug}`,
        sortDate: releaseYearString(a.release_date || a.created_at),
        image: a.blok_tall ?? null,
      }));
    }

    let next = [...films];

    if (mix === 'coming-soon') {
      next = next.filter((f) => isComingSoon(f.release_date));
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

    return next.map((f) => ({
      id: f.id,
      name: f.name,
      teaser: f.teaser,
      href: `/film/${f.slug}`,
      sortDate: f.story_date,
      image: f.blok_tall ?? null,
      filmId: f.id,
      slug: f.slug,
      runtime: f.runtime,
      mux_playback_id: f.mux_playback_id,
      canResume: !isComingSoon(f.release_date),
    }));
  }, [artifacts, films, mix, mixes, showingArtifacts, theme]);

  const handleResume = (item: TimelineRailItem) => {
    if (!item.canResume || !item.slug) return;
    openTheaterFromFilm({
      film: {
        id: item.filmId || item.id,
        name: item.name,
        slug: item.slug,
        mux_playback_id: item.mux_playback_id ?? null,
        runtime: item.runtime,
      },
      setSelectedFilm,
      setStartAt,
      setShowTheater,
      requireProgress: true,
    });
  };

  return (
    <>
      <TimelineRail
        items={items}
        storageKey={`fjorr-timeline-scroll:${contentType}`}
        groupKeyPrefix={showingArtifacts ? 'a' : 'f'}
        onResume={showingArtifacts ? undefined : handleResume}
      />

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
