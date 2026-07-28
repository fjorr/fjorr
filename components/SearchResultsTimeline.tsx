'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { SearchItem } from '@/components/SearchExperience';
import TimelineRail, { type TimelineRailItem } from '@/components/TimelineRail';
import TheaterOpenShell from '@/components/TheaterOpenShell';
import { useMinimalFilter } from '@/components/MinimalFilterContext';
import {
  filterAndSortSearchItems,
  themesFromSearchItems,
} from '@/lib/filter-search-items';
import {
  clearWatchProgress,
  trackWatchProgress,
} from '@/lib/watch-progress';
import { createClient } from '@/lib/supabase/client';
import { openTheaterFromFilm } from '@/lib/theater-open';

const CinemaTheater = dynamic(() => import('@/components/CinemaTheater'), {
  ssr: false,
  loading: () => <TheaterOpenShell />,
});

function releaseYearString(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const year = new Date(iso).getFullYear();
  return Number.isFinite(year) ? String(year) : null;
}

function storyDateLabel(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw === 'object' && raw && 'name' in raw) {
    const name = (raw as { name?: unknown }).name;
    return typeof name === 'string' && name.trim() ? name : null;
  }
  const text = String(raw).trim();
  return text || null;
}

function isComingSoon(releaseDate?: string | null) {
  if (!releaseDate) return false;
  return new Date(releaseDate).getTime() > Date.now();
}

/** Search results rendered in the vertical Time rail. */
export default function SearchResultsTimeline({
  results,
}: {
  results: SearchItem[];
}) {
  const { theme, mix, mixes, setThemes, contentType } = useMinimalFilter();
  const [storyDates, setStoryDates] = useState<Record<string, string | null>>({});
  const [showTheater, setShowTheater] = useState(false);
  const [selectedFilm, setSelectedFilm] = useState<any>(null);
  const [startAt, setStartAt] = useState<number | undefined>(undefined);

  useEffect(() => {
    setThemes(themesFromSearchItems(results));
  }, [results, setThemes]);

  const typed = useMemo(() => {
    const byType = results.filter((item) =>
      contentType === 'artifact'
        ? item.item_type === 'artifact'
        : item.item_type === 'film',
    );
    return filterAndSortSearchItems(byType, {
      sort: 'newest',
      theme,
      mix,
      mixes,
    });
  }, [contentType, mix, mixes, results, theme]);

  useEffect(() => {
    if (contentType === 'artifact') {
      setStoryDates({});
      return;
    }

    const filmIds = [
      ...new Set(
        typed
          .filter((item) => item.item_type === 'film')
          .map((item) => item.internal_id || item.id)
          .filter(Boolean),
      ),
    ];

    if (filmIds.length === 0) {
      setStoryDates({});
      return;
    }

    let cancelled = false;
    const supabase = createClient();
    supabase
      .from('film')
      .select('id, story_date')
      .in('id', filmIds)
      .then(({ data }) => {
        if (cancelled || !data) return;
        const next: Record<string, string | null> = {};
        for (const row of data) {
          next[row.id] = storyDateLabel(row.story_date);
        }
        setStoryDates(next);
      });

    return () => {
      cancelled = true;
    };
  }, [contentType, typed]);

  const items = useMemo((): TimelineRailItem[] => {
    return typed.map((item) => {
      const filmId = item.internal_id || item.id;
      const sortDate =
        item.item_type === 'film'
          ? storyDates[filmId] ?? releaseYearString(item.release_date)
          : releaseYearString(item.release_date);
      const isFilm = item.item_type === 'film';

      return {
        id: item.id,
        name: item.name,
        teaser: item.teaser || null,
        href: isFilm ? `/film/${item.slug}` : `/artifact/${item.slug}`,
        sortDate,
        image: item.blok_tall || null,
        filmId: isFilm ? filmId : null,
        slug: item.slug,
        runtime: item.runtime ?? null,
        canResume: isFilm && !isComingSoon(item.release_date),
        search_content: item.search_content || null,
      };
    });
  }, [storyDates, typed]);

  const handleResume = (item: TimelineRailItem) => {
    if (!item.canResume || !item.slug) return;
    openTheaterFromFilm({
      film: {
        id: item.filmId || item.id,
        name: item.name,
        slug: item.slug,
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
        storageKey={`fjorr-timeline-scroll:search:${contentType}`}
        groupKeyPrefix={`search-${contentType}`}
        onResume={contentType === 'artifact' ? undefined : handleResume}
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
