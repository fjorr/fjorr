'use client';

import React, { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import CatalogPosterGrid from '@/components/house/CatalogPosterGrid';
import { parseStoryYear } from '@/lib/story-year';

export type CatalogIndexItem = {
  id: string;
  slug: string;
  name: string;
  runtime: number | null;
  comingSoon: boolean;
  kind?: 'film' | 'artifact';
  rating?: string | null;
  /** Raw story date for sort / display fallback. */
  storyDate?: string | null;
  /** Prefers this over parsing storyDate when set (e.g. search catalog). */
  setting?: string | null;
  /** Match snippet that contains the query term. */
  why?: string | null;
  /** Catalog line under the title when there is no match snippet. */
  teaser?: string | null;
  /** Portrait poster. */
  thumb?: string | null;
  pageBg?: string | null;
  /** Caption year, e.g. "1972" or "1600 BC". */
  captionYear?: string | null;
  /** Rest of the caption, e.g. "3m", "Coming Soon", or "Book". */
  captionDetail?: string | null;
};

export type CatalogKind = 'all' | 'film' | 'artifact';

type Props = {
  items: CatalogIndexItem[];
  /** Year / Coming Soon toggles (browse). Off for search results. */
  showControls?: boolean;
  /** Open film / artifact. */
  onPlay: (slug: string) => void;
  /** Results scroller offset — parent uses for chrome hide / nav glass. */
  onResultsScroll?: (scrollTop: number) => void;
  /** When false, the parent owns scrolling. */
  scrollable?: boolean;
  /** Slide the toggles away (search chrome hide-on-scroll). */
  controlsHidden?: boolean;
};

type SortKey = 'catalog' | 'year';

function sortItems(items: CatalogIndexItem[], key: SortKey) {
  if (key === 'catalog') return items;

  const yearOf = (item: CatalogIndexItem) =>
    parseStoryYear(item.captionYear) ?? parseStoryYear(item.storyDate);

  return [...items].sort((a, b) => {
    const ya = yearOf(a);
    const yb = yearOf(b);
    if (ya == null && yb == null) return a.name.localeCompare(b.name);
    if (ya == null) return 1;
    if (yb == null) return -1;
    if (ya !== yb) return ya - yb;
    return a.name.localeCompare(b.name);
  });
}

/** Catalog / search poster grid with optional Year and Coming Soon toggles. */
export default function CatalogIndex({
  items,
  showControls = true,
  onPlay,
  onResultsScroll,
  scrollable = true,
  controlsHidden = false,
}: Props) {
  const t = useTranslations('Film');
  const [sortKey, setSortKey] = useState<SortKey>('catalog');
  const [comingSoonOnly, setComingSoonOnly] = useState(false);

  const hasComingSoon = useMemo(
    () => items.some((item) => item.kind !== 'artifact' && item.comingSoon),
    [items]
  );

  const displayItems = useMemo(() => {
    let next = items;
    if (showControls && comingSoonOnly && hasComingSoon) {
      next = next.filter((item) => item.kind !== 'artifact' && item.comingSoon);
    }
    return sortItems(next, showControls ? sortKey : 'catalog');
  }, [comingSoonOnly, hasComingSoon, items, showControls, sortKey]);

  const pill = (active: boolean, label: string, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-1.5 font-sans text-[13px] font-medium leading-none tracking-tight transition-colors ${
        active
          ? 'border-[#0B0B0C] bg-[#0B0B0C] text-white'
          : 'border-black/15 bg-transparent text-black/60 hover:border-black/30 hover:text-[#0B0B0C]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div
      className={
        scrollable
          ? 'flex min-h-0 w-full flex-1 flex-col'
          : 'flex w-full flex-col'
      }
    >
      {/* Search results keep the row's height (hidden) so the grid doesn't shift while typing. */}
      <div
        aria-hidden={!showControls}
        className={`sticky top-0 z-[1] transition-transform duration-200 ease-out ${
          !showControls ? 'invisible' : ''
        } ${
          controlsHidden
            ? 'pointer-events-none -translate-y-[120%]'
            : 'translate-y-0'
        }`}
      >
        <div className="mx-auto mb-5 flex w-full max-w-[44rem] flex-wrap items-center justify-center gap-2 bg-white/90 backdrop-blur-md">
          {hasComingSoon
            ? pill(comingSoonOnly, t('comingSoon'), () =>
                setComingSoonOnly((on) => !on)
              )
            : null}
          {pill(sortKey === 'year', t('browseChronological'), () =>
            setSortKey((key) => (key === 'year' ? 'catalog' : 'year'))
          )}
        </div>
      </div>

      <CatalogPosterGrid
        items={displayItems.map((item) => ({
          id: item.id,
          slug: item.slug,
          name: item.name,
          thumb: item.thumb ?? null,
          pageBg: item.pageBg ?? null,
          captionYear: item.captionYear ?? null,
          captionDetail: item.captionDetail ?? null,
          yearFirst: item.kind !== 'artifact',
          comingSoon: item.kind !== 'artifact' && item.comingSoon,
          playable: item.kind !== 'artifact' && !item.comingSoon,
        }))}
        highlightYear={showControls && sortKey === 'year'}
        onPlay={onPlay}
        onScrollOffset={scrollable ? onResultsScroll : undefined}
        scrollable={scrollable}
      />
    </div>
  );
}
