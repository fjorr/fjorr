'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/ui/Icons';
import CatalogPosterGrid from '@/components/house/CatalogPosterGrid';
import { parseStoryYear, storySettingDisplay } from '@/lib/story-year';

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
  /** Portrait poster for grid view. */
  thumb?: string | null;
  pageBg?: string | null;
};

type Props = {
  items: CatalogIndexItem[];
  activeSlug?: string | null;
  /** Hide sort / Coming Soon controls (search results). */
  showControls?: boolean;
  /** All / Film / Artifact filter (search results). */
  showKindFilter?: boolean;
  /** Open film / artifact. */
  onPlay: (slug: string) => void;
  onHover?: (slug: string) => void;
  /** Results scroller offset — used to compact the search field on mobile. */
  onResultsScroll?: (scrollTop: number) => void;
  /**
   * When false, filters stay put and the parent owns scrolling
   * (CommandLine compact-on-scroll).
   */
  scrollable?: boolean;
};

type SortKey = 'catalog' | 'title' | 'year' | 'runtime';
type KindFilter = 'all' | 'film' | 'artifact';
export type CatalogViewMode = 'index' | 'grid';
type ViewMode = CatalogViewMode;

const VIEW_KEY = 'fjorr-catalog-view';

function runtimeLabel(seconds?: number | null) {
  const minutes = Math.ceil((seconds || 0) / 60);
  return minutes === 0 ? '1m' : `${minutes}m`;
}

function sortItems(items: CatalogIndexItem[], key: SortKey) {
  if (key === 'catalog') return items;

  return [...items].sort((a, b) => {
    if (key === 'title') {
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    }
    if (key === 'year') {
      const ya = parseStoryYear(a.storyDate);
      const yb = parseStoryYear(b.storyDate);
      if (ya == null && yb == null) return a.name.localeCompare(b.name);
      if (ya == null) return 1;
      if (yb == null) return -1;
      if (ya !== yb) return ya - yb;
      return a.name.localeCompare(b.name);
    }
    const ra = a.comingSoon
      ? Number.POSITIVE_INFINITY
      : a.runtime ?? Number.POSITIVE_INFINITY;
    const rb = b.comingSoon
      ? Number.POSITIVE_INFINITY
      : b.runtime ?? Number.POSITIVE_INFINITY;
    if (ra !== rb) return ra - rb;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Catalog / search — index rows or poster grid, with shared sorts.
 */
export default function CatalogIndex({
  items,
  activeSlug = null,
  showControls = true,
  showKindFilter = false,
  onPlay,
  onHover,
  onResultsScroll,
  scrollable = true,
}: Props) {
  const t = useTranslations('Film');
  const tSearch = useTranslations('Search');
  const [sortKey, setSortKey] = useState<SortKey>('catalog');
  const [comingSoonOnly, setComingSoonOnly] = useState(false);
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(VIEW_KEY);
      if (stored === 'grid' || stored === 'index') {
        setViewMode(stored);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setView = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      sessionStorage.setItem(VIEW_KEY, mode);
    } catch {
      /* ignore */
    }
  };

  const hasComingSoon = useMemo(
    () => items.some((item) => item.kind !== 'artifact' && item.comingSoon),
    [items]
  );

  const displayItems = useMemo(() => {
    let next = items;
    if (showKindFilter && kindFilter === 'film') {
      next = next.filter((item) => item.kind !== 'artifact');
    } else if (showKindFilter && kindFilter === 'artifact') {
      next = next.filter((item) => item.kind === 'artifact');
    }
    if (showControls && comingSoonOnly) {
      next = next.filter((item) => item.kind !== 'artifact' && item.comingSoon);
    }
    return sortItems(next, showControls ? sortKey : 'catalog');
  }, [comingSoonOnly, items, kindFilter, showControls, showKindFilter, sortKey]);

  const chip = (
    active: boolean,
    label: string,
    onClick: () => void,
    pressed?: boolean
  ) => (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed ?? active}
      className={`border-0 bg-transparent p-0 font-sans text-[12px] font-semibold transition-colors ${
        active ? 'text-[#0B0B0C]' : 'text-black/30 hover:text-black/50'
      }`}
    >
      {label}
    </button>
  );

  const viewToggle = (
    <div className="flex shrink-0 items-center gap-2.5">
      <button
        type="button"
        onClick={() => setView('index')}
        aria-pressed={viewMode === 'index'}
        aria-label={t('browseViewIndex')}
        className={`inline-flex size-7 items-center justify-center border-0 bg-transparent p-0 transition-colors ${
          viewMode === 'index' ? 'text-[#0B0B0C]' : 'text-black/30 hover:text-black/50'
        }`}
      >
        <Icon name="heroView" className="h-[14px] w-[14px]" />
      </button>
      <button
        type="button"
        onClick={() => setView('grid')}
        aria-pressed={viewMode === 'grid'}
        aria-label={t('browseViewGrid')}
        className={`inline-flex size-7 items-center justify-center border-0 bg-transparent p-0 transition-colors ${
          viewMode === 'grid' ? 'text-[#0B0B0C]' : 'text-black/30 hover:text-black/50'
        }`}
      >
        <Icon name="cardView" className="h-[15px] w-[12px]" />
      </button>
    </div>
  );

  const gridCols =
    'md:grid-cols-[minmax(0,1fr)_5.5rem_3.25rem]';

  const kindChips = (
    <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
      {chip(kindFilter === 'all', t('browseFilterAll'), () => setKindFilter('all'))}
      {chip(kindFilter === 'film', t('browseFilterFilm'), () =>
        setKindFilter('film')
      )}
      {chip(kindFilter === 'artifact', t('browseFilterArtifact'), () =>
        setKindFilter('artifact')
      )}
    </div>
  );

  const controlBar = (
    <div
      className={`mb-4 flex w-full shrink-0 items-center gap-3 ${
        showControls || showKindFilter ? 'justify-between' : 'justify-end'
      }`}
    >
      {showControls ? (
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
          {chip(sortKey === 'catalog', t('browseSortCatalog'), () =>
            setSortKey('catalog')
          )}
          {chip(sortKey === 'title', t('browseSortTitle'), () =>
            setSortKey('title')
          )}
          {chip(sortKey === 'year', t('browseChronological'), () =>
            setSortKey('year')
          )}
          {chip(sortKey === 'runtime', t('browseSortRuntime'), () =>
            setSortKey('runtime')
          )}
          {hasComingSoon ? (
            <>
              <span className="text-black/15" aria-hidden>
                ·
              </span>
              {chip(
                comingSoonOnly,
                t('comingSoon'),
                () => setComingSoonOnly((on) => !on),
                comingSoonOnly
              )}
            </>
          ) : null}
        </div>
      ) : showKindFilter ? (
        kindChips
      ) : null}
      {viewToggle}
    </div>
  );

  return (
    <div
      className={
        scrollable
          ? 'flex min-h-0 w-full flex-1 flex-col'
          : 'flex w-full flex-col'
      }
    >
      {/* Filters + view mode stay under the search input width. */}
      <div className="mx-auto w-full max-w-[44rem] shrink-0">{controlBar}</div>

      {viewMode === 'grid' ? (
        displayItems.length === 0 && showKindFilter ? (
          <p className="mx-auto w-full max-w-[44rem] py-2.5 font-interTight text-[24px] font-bold leading-none tracking-tight text-[#0B0B0C] sm:text-[28px] md:text-[32px]">
            {tSearch('nothingMatches')}
          </p>
        ) : (
          <CatalogPosterGrid
            items={displayItems.map((item) => ({
              id: item.id,
              slug: item.slug,
              name: item.name,
              thumb: item.thumb ?? null,
              comingSoon: item.comingSoon,
              kind: item.kind,
              pageBg: item.pageBg ?? null,
            }))}
            onPlay={onPlay}
            onScrollOffset={scrollable ? onResultsScroll : undefined}
            scrollable={scrollable}
          />
        )
      ) : (
        <div
          className={
            scrollable
              ? 'mx-auto min-h-0 w-full max-w-[44rem] flex-1 overflow-y-auto'
              : 'mx-auto w-full max-w-[44rem]'
          }
          onScroll={
            scrollable && onResultsScroll
              ? (event) => onResultsScroll(event.currentTarget.scrollTop)
              : undefined
          }
        >
          <ul className="m-0 list-none p-0" aria-label={t('browseHeadline')}>
            {displayItems.length === 0 ? (
              <li
                className={
                  showKindFilter
                    ? 'py-2.5 font-interTight text-[24px] font-bold leading-none tracking-tight text-[#0B0B0C] sm:text-[28px] md:text-[32px]'
                    : 'py-1.5 font-sans text-[13px] text-black/40'
                }
              >
                {showKindFilter ? tSearch('nothingMatches') : '—'}
              </li>
            ) : (
              displayItems.map((item) => {
                const active = item.slug === activeSlug;
                const isArtifact = item.kind === 'artifact';
                const setting =
                  item.setting?.trim() ||
                  storySettingDisplay(item.storyDate) ||
                  null;
                const duration =
                  isArtifact || item.comingSoon
                    ? null
                    : runtimeLabel(item.runtime);
                const metaRight = isArtifact
                  ? t('browseArtifact')
                  : duration || '—';
                const why = item.why?.trim() || '';

                return (
                  <li
                    key={`${item.kind || 'film'}:${item.id}`}
                    className="border-b border-black/[0.06] bg-transparent last:border-b-0"
                    onMouseEnter={() => onHover?.(item.slug)}
                  >
                    <div
                      className={`flex items-center gap-3 bg-transparent py-2.5 md:grid md:gap-3 ${gridCols}`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onPlay(item.slug);
                        }}
                        aria-current={active ? 'true' : undefined}
                        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-left hover:bg-transparent focus:bg-transparent active:bg-transparent md:flex-none"
                      >
                        <span className="flex min-w-0 items-baseline gap-x-1.5">
                          <span className="min-w-0 truncate font-interTight text-[15px] font-bold leading-tight tracking-tight text-[#0B0B0C] md:text-[16px]">
                            {item.name}
                          </span>
                          {!isArtifact &&
                          item.comingSoon &&
                          !comingSoonOnly ? (
                            <span className="shrink-0 font-sans text-[12px] font-medium tracking-tight text-black/30">
                              {t('comingSoon')}
                            </span>
                          ) : null}
                        </span>
                        {why ? (
                          <span className="mt-0.5 block truncate font-sans text-[12px] font-medium leading-snug text-black/40">
                            {why}
                          </span>
                        ) : null}
                      </button>

                      <span className="hidden truncate font-sans text-[12px] font-medium text-black/40 md:block">
                        {setting || '—'}
                      </span>
                      <span className="hidden font-sans text-[12px] font-medium tabular-nums text-black/40 md:block">
                        {metaRight}
                      </span>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
