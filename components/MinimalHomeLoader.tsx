import React from 'react';
import MinimalHomeList, { type MinimalFilm } from '@/components/MinimalHomeList';
import { getMinimalHomeFilms } from '@/lib/content/home';

function mapFilm(film: any): MinimalFilm {
  return {
    id: film.id,
    name: film.name,
    slug: String(film.slug || '').trim(),
    teaser: film.teaser ?? null,
    runtime: film.runtime ?? null,
    release_date: film.release_date ?? null,
    story_date:
      typeof film.story_date === 'object'
        ? film.story_date?.name ?? null
        : film.story_date ?? null,
    mux_playback_id: film.mux_playback_id ?? null,
    rating:
      typeof film.rating === 'object' ? film.rating?.name ?? null : film.rating ?? null,
    theme:
      typeof film.theme === 'object' ? film.theme?.name ?? null : film.theme ?? null,
  };
}

export default async function MinimalHomeLoader() {
  const rows = await getMinimalHomeFilms();
  const films: MinimalFilm[] = rows.map(mapFilm);

  if (films.length === 0) {
    return (
      <div className="w-full min-h-screen bg-[#1F1F1F] flex items-center justify-center text-white/40 font-sans text-sm">
        No films available.
      </div>
    );
  }

  return <MinimalHomeList films={films} />;
}
