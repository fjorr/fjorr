'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { createBrowserClient } from '@supabase/ssr';
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
  getWatchProgress,
  isWatchableProgress,
  trackWatchProgress,
} from '@/lib/watch-progress';

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
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;

    const supabase = createBrowserClient(url, key);
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
      };
    });
  }, [storyDates, typed]);

  const handleResume = async (item: TimelineRailItem) => {
    if (!item.canResume || !item.slug) return;

    const openWith = (payload: any, duration?: number | null) => {
      const saved = getWatchProgress(payload.id || item.filmId || item.id);
      if (!isWatchableProgress(saved, duration ?? item.runtime)) return;
      setStartAt(saved.seconds);
      setSelectedFilm(payload);
      setShowTheater(true);
    };

    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) {
        openWith({
          id: item.filmId || item.id,
          slug: item.slug,
          name: item.name,
          runtime: item.runtime,
        });
        return;
      }

      const supabase = createBrowserClient(url, key);
      const { data: verifiedFilm } = await supabase
        .from('film')
        .select(
          'id, name, slug, mux_playback_id, last_line, story_date, location, runtime, has_subtitles'
        )
        .eq('slug', item.slug)
        .maybeSingle();

      if (!verifiedFilm) {
        openWith({
          id: item.filmId || item.id,
          slug: item.slug,
          name: item.name,
          runtime: item.runtime,
        });
        return;
      }

      let flattenedTracks: { code: string; name: string; vtt_url: string }[] = [];

      if (verifiedFilm.has_subtitles !== false) {
        const { data: junctionTracks } = await supabase
          .from('language_subtitle')
          .select(`
            vtt_url,
            language (
              code,
              name
            )
          `)
          .eq('film_id', verifiedFilm.id);

        flattenedTracks = (junctionTracks || []).map((track: any) => ({
          code: track.language?.code || 'en',
          name: track.language?.name || 'English',
          vtt_url: track.vtt_url || '',
        }));
      }

      openWith(
        {
          ...verifiedFilm,
          language_subtitle: flattenedTracks,
        },
        verifiedFilm.runtime
      );
    } catch {
      openWith({
        id: item.filmId || item.id,
        slug: item.slug,
        name: item.name,
        runtime: item.runtime,
      });
    }
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
