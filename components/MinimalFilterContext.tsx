'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useDisplayMode } from '@/components/DisplayModeProvider';
import type { HomeMix } from '@/lib/home-mix';

export type MinimalSortMode = 'newest' | 'az' | 'runtime';
export type MinimalShowMode = 'all' | 'available' | 'comingSoon';
export type MinimalContentType = 'film' | 'artifact';

type MinimalFilterContextValue = {
  sort: MinimalSortMode;
  setSort: (value: MinimalSortMode) => void;
  show: MinimalShowMode;
  setShow: (value: MinimalShowMode) => void;
  theme: string;
  setTheme: (value: string) => void;
  themes: string[];
  setThemes: (themes: string[]) => void;
  contentType: MinimalContentType;
  setContentType: (value: MinimalContentType) => void;
  mix: string;
  setMix: (value: string) => void;
  mixes: HomeMix[];
  setMixes: (mixes: HomeMix[]) => void;
  searchActive: boolean;
  setSearchActive: (value: boolean) => void;
  filtersActive: boolean;
  queryActive: boolean;
  clearFilters: () => void;
  clearAll: () => void;
};

const MinimalFilterContext = createContext<MinimalFilterContextValue | null>(null);

function parseSort(value: string | null): MinimalSortMode {
  if (value === 'az' || value === 'runtime' || value === 'newest') return value;
  return 'newest';
}

function parseShow(value: string | null): MinimalShowMode {
  if (value === 'available' || value === 'comingSoon' || value === 'all') return value;
  return 'all';
}

function parseContentType(value: string | null): MinimalContentType {
  if (value === 'artifact') return 'artifact';
  return 'film';
}

export function MinimalFilterProvider({
  children,
  initialMixes = [],
}: {
  children: ReactNode;
  initialMixes?: HomeMix[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sort = parseSort(searchParams.get('sort'));
  const show = parseShow(searchParams.get('show'));
  const theme = searchParams.get('theme') || 'all';
  const contentType = parseContentType(searchParams.get('type'));
  const mix = searchParams.get('mix') || 'all';

  const [themes, setThemes] = useState<string[]>([]);
  const [mixes, setMixes] = useState<HomeMix[]>(initialMixes);
  const [searchActive, setSearchActive] = useState(false);

  useEffect(() => {
    if (initialMixes.length > 0) setMixes(initialMixes);
  }, [initialMixes]);

  const replaceFilterParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      let changed = false;
      for (const [key, value] of Object.entries(updates)) {
        const current = params.get(key);
        if (value == null || value === '') {
          if (current != null) {
            params.delete(key);
            changed = true;
          }
        } else if (current !== value) {
          params.set(key, value);
          changed = true;
        }
      }
      if (!changed) return;
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const setSort = useCallback(
    (value: MinimalSortMode) => {
      replaceFilterParams({ sort: value === 'newest' ? null : value });
    },
    [replaceFilterParams]
  );

  const setShow = useCallback(
    (value: MinimalShowMode) => {
      replaceFilterParams({ show: value === 'all' ? null : value });
    },
    [replaceFilterParams]
  );

  const setTheme = useCallback(
    (value: string) => {
      replaceFilterParams({ theme: value === 'all' ? null : value });
    },
    [replaceFilterParams]
  );

  const setContentType = useCallback(
    (value: MinimalContentType) => {
      // Leaving films clears mix; artifacts don't use mixes.
      replaceFilterParams({
        type: value === 'film' ? null : value,
        ...(value === 'artifact' ? { mix: null, show: null, theme: null } : {}),
      });
    },
    [replaceFilterParams]
  );

  const setMix = useCallback(
    (value: string) => {
      replaceFilterParams({ mix: value === 'all' ? null : value });
    },
    [replaceFilterParams]
  );

  const { isMinimal, setMode } = useDisplayMode();

  const clearFilters = useCallback(() => {
    replaceFilterParams({
      sort: null,
      show: null,
      theme: null,
      type: null,
    });
  }, [replaceFilterParams]);

  const clearAll = useCallback(() => {
    replaceFilterParams({
      sort: null,
      show: null,
      theme: null,
      type: null,
      mix: null,
    });
    if (isMinimal) setMode('cinematic');
  }, [isMinimal, replaceFilterParams, setMode]);

  const filtersActive = sort !== 'newest' || theme !== 'all';

  const queryActive =
    filtersActive || mix !== 'all' || contentType !== 'film' || isMinimal;

  const value = useMemo(
    () => ({
      sort,
      setSort,
      show,
      setShow,
      theme,
      setTheme,
      themes,
      setThemes,
      contentType,
      setContentType,
      mix,
      setMix,
      mixes,
      setMixes,
      searchActive,
      setSearchActive,
      filtersActive,
      queryActive,
      clearFilters,
      clearAll,
    }),
    [
      sort,
      setSort,
      show,
      setShow,
      theme,
      setTheme,
      themes,
      contentType,
      setContentType,
      mix,
      setMix,
      mixes,
      searchActive,
      filtersActive,
      queryActive,
      clearFilters,
      clearAll,
    ]
  );

  return (
    <MinimalFilterContext.Provider value={value}>{children}</MinimalFilterContext.Provider>
  );
}

export function useMinimalFilter() {
  const ctx = useContext(MinimalFilterContext);
  if (!ctx) {
    throw new Error('useMinimalFilter must be used within MinimalFilterProvider');
  }
  return ctx;
}

export function useMinimalFilterOptional() {
  return useContext(MinimalFilterContext);
}

function OptionButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 px-3 rounded-[6px] font-sans text-[12px] font-semibold transition-colors ${
        active
          ? 'bg-white/20 text-white'
          : 'bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}

/** Compact readout of browse state under the control bar — always visible. */
export function capitalizeLabel(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return value;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function useQueryStatusLabels() {
  const tf = useTranslations('MinimalList');
  const tDisplay = useTranslations('DisplayMode');
  const { isMinimal } = useDisplayMode();
  const { mix, mixes, sort, theme, contentType, queryActive, clearAll } =
    useMinimalFilter();

  const mixName =
    mix === 'coming-soon'
      ? capitalizeLabel(tf('comingSoon'))
      : mixes.find((m) => m.slug === mix)?.name;

  const modeLabel = isMinimal ? tDisplay('minimalFull') : tDisplay('cinematicFull');
  const typeLabel = contentType === 'artifact' ? tf('artifact') : tDisplay('film');
  const mixLabel = mix !== 'all' && mixName ? capitalizeLabel(mixName) : tf('noMixes');
  const dialLabels: string[] = [];
  if (sort !== 'newest') dialLabels.push(tf(sort));
  if (theme !== 'all') dialLabels.push(theme);

  return {
    modeLabel,
    typeLabel,
    mixLabel,
    dialLabels,
    queryActive,
    clearAll,
    isMinimal,
    contentType,
    mix,
    sort,
    theme,
  };
}

export function QueryStatusBar() {
  const tf = useTranslations('MinimalList');
  const {
    modeLabel,
    typeLabel,
    mixLabel,
    dialLabels,
    queryActive,
    clearAll,
  } = useQueryStatusLabels();

  const parts = [modeLabel, typeLabel, mixLabel, ...dialLabels];

  return (
    <div className="flex items-center justify-center gap-2.5 min-h-[18px] px-2">
      <p className="font-sans text-[11px] font-medium text-white/45 tracking-tight truncate max-w-[min(100%,28rem)]">
        {parts.join(' · ')}
      </p>
      {queryActive && (
        <button
          type="button"
          onClick={clearAll}
          className="shrink-0 font-sans text-[11px] font-semibold text-[#FF385C] hover:text-[#FF5A5F] transition-colors"
        >
          {tf('clear')}
        </button>
      )}
    </div>
  );
}

const COMING_SOON_MIX_SLUG = 'coming-soon';

/** Mixes — curated collections + Coming Soon. Greyed out for artifacts. */
export function MixesButton() {
  const tf = useTranslations('MinimalList');
  const { mix, setMix, mixes, contentType } = useMinimalFilter();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const disabled = contentType === 'artifact';

  const listItems = useMemo(() => {
    const comingSoonLabel = capitalizeLabel(tf('comingSoon'));
    const fromDb = mixes
      .filter((m) => m.slug !== COMING_SOON_MIX_SLUG)
      .map((m) => ({ ...m, name: capitalizeLabel(m.name) }));
    return [
      { slug: COMING_SOON_MIX_SLUG, name: comingSoonLabel, filmIds: [] as string[] },
      ...fromDb,
    ];
  }, [mixes, tf]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const label = tf('mixes');

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((value) => !value);
        }}
        className={`h-8 px-3 rounded-[6px] font-sans text-xs font-semibold transition-colors inline-flex items-center gap-1.5 ${
          disabled
            ? 'bg-white/[0.03] text-white/25 cursor-not-allowed'
            : open || mix !== 'all'
              ? 'bg-white/15 text-white'
              : 'bg-white/5 text-white/55 hover:text-white/80 hover:bg-white/10'
        }`}
        aria-expanded={open}
        aria-disabled={disabled}
      >
        {label}
        {!disabled && mix !== 'all' && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#ffd446]" aria-hidden />
        )}
      </button>

      {open && !disabled && (
        <div className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+8px)] z-30 w-[min(100vw-2.5rem,280px)] rounded-[10px] border border-white/10 bg-[#1F1F1F]/95 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.45)] p-3 flex flex-col gap-1 max-h-[min(60vh,360px)] overflow-y-auto">
          <button
            type="button"
            onClick={() => {
              setMix('all');
              setOpen(false);
            }}
            className={`text-left h-9 px-3 rounded-[6px] font-sans text-[13px] font-semibold transition-colors ${
              mix === 'all'
                ? 'bg-white/15 text-white'
                : 'text-white/55 hover:text-white/85 hover:bg-white/10'
            }`}
          >
            {capitalizeLabel(tf('allMixes'))}
          </button>
          {listItems.map((item) => (
            <button
              key={item.slug}
              type="button"
              onClick={() => {
                setMix(item.slug);
                setOpen(false);
              }}
              className={`text-left h-9 px-3 rounded-[6px] font-sans text-[13px] font-semibold transition-colors ${
                mix === item.slug
                  ? 'bg-white/15 text-white'
                  : 'text-white/55 hover:text-white/85 hover:bg-white/10'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Dials control — sits next to Mixes / the cine·mini toggle. */
export function MinimalFilterButton() {
  const tf = useTranslations('MinimalList');
  const {
    sort,
    setSort,
    theme,
    setTheme,
    themes,
    contentType,
    clearFilters,
  } = useMinimalFilter();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const dialsActive = sort !== 'newest' || theme !== 'all';

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`h-8 px-3 rounded-[6px] font-sans text-xs font-semibold transition-colors inline-flex items-center gap-1.5 ${
          open || dialsActive
            ? 'bg-white/15 text-white'
            : 'bg-white/5 text-white/55 hover:text-white/80 hover:bg-white/10'
        }`}
        aria-expanded={open}
      >
        {tf('filter')}
        {dialsActive && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#ffd446]" aria-hidden />
        )}
      </button>

      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+8px)] z-30 w-[min(100vw-2.5rem,320px)] rounded-[10px] border border-white/10 bg-[#1F1F1F]/95 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.45)] p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
              {tf('sort')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              <OptionButton active={sort === 'newest'} onClick={() => setSort('newest')}>
                {tf('newest')}
              </OptionButton>
              <OptionButton active={sort === 'az'} onClick={() => setSort('az')}>
                {tf('az')}
              </OptionButton>
              {contentType === 'film' && (
                <OptionButton active={sort === 'runtime'} onClick={() => setSort('runtime')}>
                  {tf('runtime')}
                </OptionButton>
              )}
            </div>
          </div>

          {contentType === 'film' && (
            <div className="flex flex-col gap-2">
              <p className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
                {tf('theme')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <OptionButton active={theme === 'all'} onClick={() => setTheme('all')}>
                  {tf('allThemes')}
                </OptionButton>
                {themes.map((name) => (
                  <OptionButton key={name} active={theme === name} onClick={() => setTheme(name)}>
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </OptionButton>
                ))}
              </div>
            </div>
          )}

          {dialsActive && (
            <button
              type="button"
              onClick={() => {
                clearFilters();
              }}
              className="self-start font-sans text-[12px] font-semibold text-white/40 hover:text-white/70 transition-colors"
            >
              {tf('clear')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
