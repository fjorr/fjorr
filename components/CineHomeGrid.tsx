'use client';

import React, { useEffect, useMemo } from 'react';
import type { SearchItem } from '@/components/SearchExperience';
import SearchResultsGrid from '@/components/SearchResultsGrid';
import { useMinimalFilter } from '@/components/MinimalFilterContext';

export type CineGridFilm = {
  id: string;
  name: string;
  slug: string;
  teaser?: string | null;
  runtime?: number | null;
  release_date?: string | null;
  blok_tall?: string | null;
  rating?: string | null;
  theme?: string | null;
};

export type CineGridArtifact = {
  id: string;
  name: string;
  slug: string;
  teaser?: string | null;
  blok_tall?: string | null;
  created_at?: string | null;
};

function filmToSearchItem(film: CineGridFilm): SearchItem {
  return {
    id: film.id,
    internal_id: film.id,
    item_type: 'film',
    slug: film.slug,
    name: film.name,
    teaser: film.teaser || '',
    blok_tall: film.blok_tall || '',
    search_content: '',
    release_date: film.release_date || '',
    rating: film.rating || undefined,
    theme: film.theme || undefined,
    runtime: film.runtime ?? undefined,
  };
}

function artifactToSearchItem(artifact: CineGridArtifact): SearchItem {
  return {
    id: artifact.id,
    internal_id: artifact.id,
    item_type: 'artifact',
    slug: artifact.slug,
    name: artifact.name,
    teaser: artifact.teaser || '',
    blok_tall: artifact.blok_tall || '',
    search_content: '',
    release_date: artifact.created_at || '',
  };
}

export default function CineHomeGrid({
  films,
  artifacts,
}: {
  films: CineGridFilm[];
  artifacts: CineGridArtifact[];
}) {
  const { mix, mixes, contentType, setThemes } = useMinimalFilter();

  useEffect(() => {
    const set = new Set<string>();
    for (const film of films) {
      if (film.theme) set.add(film.theme);
    }
    setThemes(Array.from(set).sort((a, b) => a.localeCompare(b)));
  }, [films, setThemes]);

  const items = useMemo(() => {
    if (contentType === 'artifact') {
      return artifacts.map(artifactToSearchItem);
    }

    if (mix === 'coming-soon') {
      const now = Date.now();
      return films
        .filter((f) => f.release_date && new Date(f.release_date).getTime() > now)
        .map(filmToSearchItem);
    }

    const selected = mix === 'all' ? null : mixes.find((m) => m.slug === mix);
    const idSet = selected ? new Set(selected.filmIds) : null;
    const pool = idSet ? films.filter((f) => idSet.has(f.id)) : films;

    if (selected) {
      const order = new Map(selected.filmIds.map((id, i) => [id, i]));
      return [...pool]
        .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
        .map(filmToSearchItem);
    }

    return pool.map(filmToSearchItem);
  }, [artifacts, contentType, films, mix, mixes]);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-8 md:px-16 mt-8 md:mt-12">
      <SearchResultsGrid results={items} postersOnly />
    </div>
  );
}
