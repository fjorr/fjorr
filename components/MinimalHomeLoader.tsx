import React from 'react';
import { createClient } from '@/utils/supabase/server';
import MinimalHomeList, { type MinimalFilm } from '@/components/MinimalHomeList';

const FILM_SELECT = `
  id,
  name,
  slug,
  teaser,
  runtime,
  release_date,
  story_date,
  mux_playback_id,
  rating ( name ),
  theme ( name )
`;

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
  const supabase = await createClient();
  const currentIsoString = new Date().toISOString();

  const [released, comingSoon] = await Promise.all([
    supabase
      .from('film')
      .select(FILM_SELECT)
      .lte('release_date', currentIsoString)
      .order('release_date', { ascending: false })
      .limit(50),
    supabase
      .from('film')
      .select(FILM_SELECT)
      .gt('release_date', currentIsoString)
      .order('release_date', { ascending: true })
      .limit(50),
  ]);

  if (released.error) {
    console.error('Minimal home released films failed:', released.error);
  }
  if (comingSoon.error) {
    console.error('Minimal home coming soon films failed:', comingSoon.error);
  }

  const films: MinimalFilm[] = [
    ...(released.data || []).map(mapFilm),
    ...(comingSoon.data || []).map(mapFilm),
  ];

  if (films.length === 0) {
    return (
      <div className="w-full min-h-screen bg-[#1F1F1F] flex items-center justify-center text-white/40 font-sans text-sm">
        No films available.
      </div>
    );
  }

  return <MinimalHomeList films={films} />;
}
