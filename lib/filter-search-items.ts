import type { SearchItem } from '@/components/SearchExperience';
import type {
  MinimalShowMode,
  MinimalSortMode,
} from '@/components/MinimalFilterContext';

function isComingSoon(releaseDate?: string | null) {
  if (!releaseDate) return false;
  return new Date(releaseDate).getTime() > Date.now();
}

function releaseTime(item: SearchItem) {
  if (!item.release_date) return 0;
  return new Date(item.release_date).getTime();
}

export function themesFromSearchItems(results: SearchItem[]): string[] {
  const set = new Set<string>();
  for (const item of results) {
    if (item.item_type === 'film' && item.theme) set.add(item.theme);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function filterAndSortSearchItems(
  results: SearchItem[],
  {
    sort,
    show,
    theme,
  }: {
    sort: MinimalSortMode;
    show: MinimalShowMode;
    theme: string;
  }
): SearchItem[] {
  let next = [...results];

  if (show === 'available') {
    next = next.filter(
      (item) => item.item_type !== 'film' || !isComingSoon(item.release_date)
    );
  }
  if (show === 'comingSoon') {
    next = next.filter(
      (item) => item.item_type === 'film' && isComingSoon(item.release_date)
    );
  }
  if (theme !== 'all') {
    next = next.filter(
      (item) => item.item_type === 'film' && item.theme === theme
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
