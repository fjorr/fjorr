'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { createBrowserClient } from '@supabase/ssr';
import { useMinimalFilter } from '@/components/MinimalFilterContext';
import TimelineRail, { type TimelineRailItem } from '@/components/TimelineRail';
import TheaterOpenShell from '@/components/TheaterOpenShell';
import type { MinimalFilm } from '@/components/MinimalHomeList';
import type { MinimalArtifact } from '@/components/MinimalArtifactList';
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
    const set = new Set<string>();
    for (const film of films) {
      if (film.theme) set.add(film.theme);
    }
    setThemes(Array.from(set).sort((a, b) => a.localeCompare(b)));
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

    if (theme !== 'all') next = next.filter((f) => f.theme === theme);

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
      canResume: !isComingSoon(f.release_date),
    }));
  }, [artifacts, films, mix, mixes, showingArtifacts, theme]);

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
