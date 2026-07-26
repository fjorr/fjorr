import React from 'react';
import CineHomeGrid, {
  type CineGridArtifact,
  type CineGridFilm,
} from '@/components/CineHomeGrid';
import { getCineHomeArtifacts, getCineHomeFilms } from '@/lib/content/home';
import { getLocale, getTranslations } from 'next-intl/server';
import { parseLocale } from '@/i18n/config';

function mapFilm(film: any): CineGridFilm {
  return {
    id: film.id,
    name: film.name,
    slug: String(film.slug || '').trim(),
    release_date: film.release_date ?? null,
    blok_tall: film.blok_tall ?? null,
    theme:
      typeof film.theme === 'object' ? film.theme?.name ?? null : film.theme ?? null,
    themeSlug:
      typeof film.theme === 'object' ? film.theme?.slug ?? null : null,
  };
}

function mapArtifact(artifact: any): CineGridArtifact {
  return {
    id: artifact.id,
    name: artifact.name,
    slug: String(artifact.slug || '').trim(),
    blok_tall: artifact.blok_tall ?? null,
    created_at: artifact.created_at ?? null,
  };
}

export default async function CineHomeLoader() {
  const locale = parseLocale(await getLocale());
  const [filmRows, artifactRows] = await Promise.all([
    getCineHomeFilms(locale),
    getCineHomeArtifacts(locale),
  ]);
  const films = filmRows.map(mapFilm).filter((f) => f.slug);
  const artifacts = artifactRows.map(mapArtifact).filter((a) => a.slug);

  if (films.length === 0 && artifacts.length === 0) {
    const t = await getTranslations('Home');
    return (
      <div className="w-full py-16 text-center text-white/40 font-sans text-sm">
        {t('noTitles')}
      </div>
    );
  }

  return <CineHomeGrid films={films} artifacts={artifacts} />;
}
