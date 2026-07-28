'use client';

import PosterRail from '@/components/PosterRail';

interface FilmRailProps {
  title: string;
  films: any[];
  size?: 'default' | 'compact';
}

export default function FilmRail({ title, films: rawFilms, size = 'default' }: FilmRailProps) {
  const items = (rawFilms || []).map((film, index) => ({
    key: String(film.id || film.slug || index),
    href: `/film/${film.slug || film.id}`,
    image: film.blok_tall as string | undefined,
    label: film.name as string | undefined,
  }));

  return <PosterRail title={title} items={items} size={size} />;
}
