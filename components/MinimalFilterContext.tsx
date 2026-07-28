'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useDisplayMode } from '@/components/DisplayModeProvider';
import type { HomeMix } from '@/lib/home-mix';

export type MinimalSortMode = 'newest' | 'az' | 'runtime';
export type MinimalShowMode = 'all' | 'available' | 'comingSoon';
export type MinimalContentType = 'film' | 'artifact';

/** Stable dial key is `slug`; `name` is locale display copy. */
export type ThemeOption = { slug: string; name: string };

type MinimalFilterContextValue = {
  sort: MinimalSortMode;
  setSort: (value: MinimalSortMode) => void;
  show: MinimalShowMode;
  setShow: (value: MinimalShowMode) => void;
  theme: string;
  setTheme: (value: string) => void;
  themes: ThemeOption[];
  setThemes: (themes: ThemeOption[]) => void;
  contentType: MinimalContentType;
  setContentType: (value: MinimalContentType) => void;
  mix: string;
  setMix: (value: string) => void;
  mixes: HomeMix[];
  setMixes: (mixes: HomeMix[]) => void;
  searchActive: boolean;
  setSearchActive: (value: boolean) => void;
  /** Per-type hit counts while searching (0 when idle). */
  searchTypeHits: { film: number; artifact: number };
  setSearchTypeHits: (hits: { film: number; artifact: number }) => void;
  filtersActive: boolean;
  /** Mix and/or dials dirty — drives Clear (not mode/type). */
  queryActive: boolean;
  clearFilters: () => void;
  clearMix: () => void;
  /** Clears dials + mix; leaves mode and Film/Afct alone. */
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

  const [themes, setThemes] = useState<ThemeOption[]>([]);
  const [mixes, setMixes] = useState<HomeMix[]>(initialMixes);
  const [searchActive, setSearchActive] = useState(false);
  const [searchTypeHits, setSearchTypeHits] = useState({
    film: 0,
    artifact: 0,
  });

  useEffect(() => {
    if (initialMixes.length > 0) setMixes(initialMixes);
  }, [initialMixes]);

  useEffect(() => {
    if (!searchActive) setSearchTypeHits({ film: 0, artifact: 0 });
  }, [searchActive]);

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
      // Theme dial is film-only; mix stays — same POV across Film / Afct.
      replaceFilterParams({
        type: value === 'film' ? null : value,
        ...(value === 'artifact' ? { show: null, theme: null } : {}),
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

  const { isTimeline } = useDisplayMode();

  // Time owns chronology — drop residual sort params from other modes.
  useEffect(() => {
    if (isTimeline && sort !== 'newest') {
      replaceFilterParams({ sort: null });
    }
  }, [isTimeline, replaceFilterParams, sort]);

  /** Dials only — never wipe mix or Film/Afct. */
  const clearFilters = useCallback(() => {
    replaceFilterParams({
      sort: null,
      show: null,
      theme: null,
    });
  }, [replaceFilterParams]);

  const clearMix = useCallback(() => {
    replaceFilterParams({ mix: null });
  }, [replaceFilterParams]);

  /** Curation reset: dials + mix. Mode and type stay. */
  const clearAll = useCallback(() => {
    replaceFilterParams({
      sort: null,
      show: null,
      theme: null,
      mix: null,
    });
  }, [replaceFilterParams]);

  const filtersActive = isTimeline
    ? theme !== 'all'
    : sort !== 'newest' || theme !== 'all';

  const queryActive = filtersActive || mix !== 'all';

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
      searchTypeHits,
      setSearchTypeHits,
      filtersActive,
      queryActive,
      clearFilters,
      clearMix,
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
      searchTypeHits,
      filtersActive,
      queryActive,
      clearFilters,
      clearMix,
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

/** Compact readout of browse state under the control bar — always visible. */
export function capitalizeLabel(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return value;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function useQueryStatusLabels() {
  const tf = useTranslations('MinimalList');
  const tDisplay = useTranslations('DisplayMode');
  const { isMinimal, isTimeline } = useDisplayMode();
  const {
    mix,
    mixes,
    sort,
    theme,
    themes,
    contentType,
    queryActive,
    filtersActive,
    clearAll,
    clearFilters,
  } = useMinimalFilter();

  const mixName =
    mix === 'coming-soon'
      ? capitalizeLabel(tf('comingSoon'))
      : mixes.find((m) => m.slug === mix)?.name;

  const modeLabel = isTimeline
    ? tDisplay('timelineFull')
    : isMinimal
      ? tDisplay('minimalFull')
      : tDisplay('cinematicFull');
  const typeLabel = contentType === 'artifact' ? tf('artifacts') : tDisplay('film');
  const mixLabel =
    mix !== 'all' && mixName ? capitalizeLabel(mixName) : tf('allMixes');
  const dialLabels: string[] = [];
  if (!isTimeline && sort !== 'newest') dialLabels.push(tf(sort));
  if (theme !== 'all') {
    const themeName = themes.find((t) => t.slug === theme)?.name || theme;
    dialLabels.push(themeName);
  }

  return {
    modeLabel,
    typeLabel,
    mixLabel,
    dialLabels,
    queryActive,
    filtersActive,
    clearAll,
    clearFilters,
    isMinimal,
    isTimeline,
    contentType,
    mix,
    sort,
    theme,
  };
}

/** Dial readout under the control bar. Mode / type live on their toggles. */
export function QueryStatusBar() {
  const tf = useTranslations('MinimalList');
  const { dialLabels, filtersActive, clearFilters } = useQueryStatusLabels();

  if (dialLabels.length === 0 && !filtersActive) return null;

  return (
    <div className="flex items-center justify-center gap-2.5 min-h-[18px] px-2">
      {dialLabels.length > 0 && (
        <p className="font-sans text-[12px] sm:text-[14px] font-medium tracking-tight truncate max-w-[min(100%,28rem)]">
          {dialLabels.map((dial, i) => (
            <span key={`${dial}-${i}`}>
              {i > 0 ? <span className="text-page-faint">{' · '}</span> : null}
              <span className="text-page">{capitalizeLabel(dial)}</span>
            </span>
          ))}
        </p>
      )}
      {filtersActive && (
        <button
          type="button"
          onClick={clearFilters}
          className="shrink-0 font-sans text-[12px] sm:text-[14px] font-semibold text-[#FF385C] hover:text-[#FF5A5F] transition-colors"
        >
          {tf('clear')}
        </button>
      )}
    </div>
  );
}

