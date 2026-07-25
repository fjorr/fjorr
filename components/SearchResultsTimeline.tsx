'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { SearchItem } from '@/components/SearchExperience';
import TimelineRail, { type TimelineRailItem } from '@/components/TimelineRail';
import { useMinimalFilter } from '@/components/MinimalFilterContext';
import {
  filterAndSortSearchItems,
  themesFromSearchItems,
} from '@/lib/filter-search-items';

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

/** Search results rendered in the vertical Time rail. */
export default function SearchResultsTimeline({
  results,
}: {
  results: SearchItem[];
}) {
  const { theme, mix, mixes, setThemes, contentType } = useMinimalFilter();
  const [storyDates, setStoryDates] = useState<Record<string, string | null>>({});

  useEffect(() => {
    setThemes(themesFromSearchItems(results));
  }, [results, setThemes]);

  const typed = useMemo(() => {
    const byType = results.filter((item) =>
      contentType === 'artifact'
        ? item.item_type === 'artifact'
        : item.item_type === 'film',
    );
    // Time is chronological — ignore sort dials.
    return filterAndSortSearchItems(byType, {
      sort: 'newest',
      theme,
      mix,
      mixes,
    });
  }, [contentType, mix, mixes, results, theme]);

  // Enrich films with story_date so search Time matches home Time.
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

      return {
        id: item.id,
        name: item.name,
        teaser: item.teaser || null,
        href:
          item.item_type === 'artifact'
            ? `/artifact/${item.slug}`
            : `/film/${item.slug}`,
        sortDate,
        image: item.blok_tall || null,
      };
    });
  }, [storyDates, typed]);

  return (
    <TimelineRail
      items={items}
      storageKey={`fjorr-timeline-scroll:search:${contentType}`}
      groupKeyPrefix={`search-${contentType}`}
    />
  );
}
