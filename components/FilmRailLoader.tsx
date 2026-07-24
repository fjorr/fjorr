import React from 'react';
import FilmRail from './FilmRail';
import { getFilmRailFilms } from '@/lib/content/home';

interface FilmRailLoaderProps {
  title: string;
}

export default async function FilmRailLoader({ title }: FilmRailLoaderProps) {
  const mode = title.toLowerCase() === 'coming soon' ? 'coming-soon' : 'latest';
  const serializedFilms = await getFilmRailFilms(mode);

  if (serializedFilms.length === 0) return null;

  return <FilmRail title={title} films={serializedFilms} />;
}
