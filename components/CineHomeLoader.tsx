import React from 'react';
import CineHomeGrid, {
  type CineGridArtifact,
  type CineGridFilm,
} from '@/components/CineHomeGrid';
import { getCineHomeArtifacts, getCineHomeFilms } from '@/lib/content/home';

function mapFilm(film: any): CineGridFilm {
  return {
    id: film.id,
    name: film.name,
    slug: String(film.slug || '').trim(),
    teaser: film.teaser ?? null,
    runtime: film.runtime ?? null,
    release_date: film.release_date ?? null,
    blok_tall: film.blok_tall ?? null,
    rating:
      typeof film.rating === 'object' ? film.rating?.name ?? null : film.rating ?? null,
    theme:
      typeof film.theme === 'object' ? film.theme?.name ?? null : film.theme ?? null,
  };
}

function mapArtifact(artifact: any): CineGridArtifact {
  return {
    id: artifact.id,
    name: artifact.name,
    slug: String(artifact.slug || '').trim(),
    teaser: artifact.teaser ?? null,
    blok_tall: artifact.blok_tall ?? null,
    created_at: artifact.created_at ?? null,
  };
}

export default async function CineHomeLoader() {
  const [filmRows, artifactRows] = await Promise.all([
    getCineHomeFilms(),
    getCineHomeArtifacts(),
  ]);
  const films = filmRows.map(mapFilm).filter((f) => f.slug);
  const artifacts = artifactRows.map(mapArtifact).filter((a) => a.slug);

  if (films.length === 0 && artifacts.length === 0) {
    return (
      <div className="w-full py-16 text-center text-white/40 font-sans text-sm">
        No titles available.
      </div>
    );
  }

  return <CineHomeGrid films={films} artifacts={artifacts} />;
}
