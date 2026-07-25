'use client';

import React, { useEffect, useMemo } from 'react';
import { useMinimalFilter } from '@/components/MinimalFilterContext';
import TimelineRail, { type TimelineRailItem } from '@/components/TimelineRail';
import type { MinimalFilm } from '@/components/MinimalHomeList';
import type { MinimalArtifact } from '@/components/MinimalArtifactList';

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
    }));
  }, [artifacts, films, mix, mixes, showingArtifacts, theme]);

  return (
    <TimelineRail
      items={items}
      storageKey={`fjorr-timeline-scroll:${contentType}`}
      groupKeyPrefix={showingArtifacts ? 'a' : 'f'}
    />
  );
}
