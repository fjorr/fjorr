import type { SearchItem } from '@/components/SearchExperience';
import type { MinimalSortMode, ThemeOption } from '@/components/MinimalFilterContext';
import type { HomeMix } from '@/lib/home-mix';

function isComingSoon(releaseDate?: string | null) {
  if (!releaseDate) return false;
  return new Date(releaseDate).getTime() > Date.now();
}

function releaseTime(item: SearchItem) {
  if (!item.release_date) return 0;
  return new Date(item.release_date).getTime();
}

function filmId(item: SearchItem) {
  return item.internal_id || item.id;
}

/** Theme dial key: prefer slug; fall back to EN name from the search table. */
function themeKey(item: SearchItem): string | null {
  return item.themeSlug || item.theme_slug || item.theme || null;
}

export function themesFromSearchItems(results: SearchItem[]): ThemeOption[] {
  const bySlug = new Map<string, string>();
  for (const item of results) {
    if (item.item_type !== 'film') continue;
    const slug = themeKey(item);
    const name = item.theme || slug;
    if (slug && name && !bySlug.has(slug)) bySlug.set(slug, name);
  }
  return Array.from(bySlug.entries())
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function themesFromFilms(
  films: { theme?: string | null; themeSlug?: string | null }[]
): ThemeOption[] {
  const bySlug = new Map<string, string>();
  for (const film of films) {
    const slug = film.themeSlug || film.theme;
    const name = film.theme || slug;
    if (slug && name && !bySlug.has(slug)) bySlug.set(slug, name);
  }
  return Array.from(bySlug.entries())
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function filterAndSortSearchItems(
  results: SearchItem[],
  {
    sort,
    theme,
    mix = 'all',
    mixes = [],
  }: {
    sort: MinimalSortMode;
    theme: string;
    mix?: string;
    mixes?: HomeMix[];
  }
): SearchItem[] {
  let next = [...results];

  if (mix === 'coming-soon') {
    next = next.filter(
      (item) => item.item_type === 'film' && isComingSoon(item.release_date)
    );
  } else if (mix !== 'all') {
    const selected = mixes.find((m) => m.slug === mix);
    if (selected) {
      const idSet = new Set(selected.filmIds);
      next = next.filter(
        (item) =>
          item.item_type === 'film' &&
          (idSet.has(filmId(item)) || idSet.has(item.id))
      );
    }
  }

  if (theme !== 'all') {
    next = next.filter(
      (item) => item.item_type === 'film' && themeKey(item) === theme
    );
  }

  next.sort((a, b) => {
    if (sort === 'az') return a.name.localeCompare(b.name);
    if (sort === 'runtime') {
      const aRuntime = a.item_type === 'film' ? a.runtime || 0 : 0;
      const bRuntime = b.item_type === 'film' ? b.runtime || 0 : 0;
      return bRuntime - aRuntime;
    }
    const aFilm = a.item_type === 'film';
    const bFilm = b.item_type === 'film';
    if (aFilm && bFilm) {
      const aSoon = isComingSoon(a.release_date);
      const bSoon = isComingSoon(b.release_date);
      if (aSoon !== bSoon) return aSoon ? 1 : -1;
      if (aSoon && bSoon) return releaseTime(a) - releaseTime(b);
      return releaseTime(b) - releaseTime(a);
    }
    if (aFilm !== bFilm) return aFilm ? -1 : 1;
    return releaseTime(b) - releaseTime(a);
  });

  return next;
}
