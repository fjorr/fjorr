import React from 'react';
import MinimalHomeBrowse from '@/components/MinimalHomeBrowse';
import { type MinimalFilm } from '@/components/MinimalHomeList';
import { type MinimalArtifact } from '@/components/MinimalArtifactList';
import { getCineHomeArtifacts, getMinimalHomeFilms } from '@/lib/content/home';

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

function mapArtifact(artifact: any): MinimalArtifact {
  return {
    id: artifact.id,
    name: artifact.name,
    slug: String(artifact.slug || '').trim(),
    teaser: artifact.teaser ?? null,
    created_at: artifact.created_at ?? null,
    label: artifact.label ?? null,
    creator: artifact.creator ?? null,
    release_date: artifact.release_date ?? null,
  };
}

export default async function MinimalHomeLoader() {
  const [filmRows, artifactRows] = await Promise.all([
    getMinimalHomeFilms(),
    getCineHomeArtifacts(),
  ]);
  const films = filmRows.map(mapFilm).filter((f) => f.slug);
  const artifacts = artifactRows.map(mapArtifact).filter((a) => a.slug);

  if (films.length === 0 && artifacts.length === 0) {
    return (
      <div className="w-full min-h-screen bg-[#1F1F1F] flex items-center justify-center text-white/40 font-sans text-sm">
        No titles available.
      </div>
    );
  }

  return <MinimalHomeBrowse films={films} artifacts={artifacts} />;
}
