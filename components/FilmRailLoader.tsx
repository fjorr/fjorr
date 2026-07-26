import React from 'react';
import FilmRail from './FilmRail';
import { getFilmRailFilms } from '@/lib/content/home';
import { getLocale } from 'next-intl/server';
import { parseLocale } from '@/i18n/config';

interface FilmRailLoaderProps {
  title: string;
}

export default async function FilmRailLoader({ title }: FilmRailLoaderProps) {
  const locale = parseLocale(await getLocale());
  const mode = title.toLowerCase() === 'coming soon' ? 'coming-soon' : 'latest';
  const serializedFilms = await getFilmRailFilms(mode, locale);

  if (serializedFilms.length === 0) return null;

  return <FilmRail title={title} films={serializedFilms} />;
}
