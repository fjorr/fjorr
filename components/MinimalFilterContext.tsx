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

  const [themes, setThemes] = useState<ThemeOption[]>([]);
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

  const { isMinimal, isTimeline, setMode } = useDisplayMode();

  // Time owns chronology — drop residual sort params from other modes.
  useEffect(() => {
    if (isTimeline && sort !== 'newest') {
      replaceFilterParams({ sort: null });
    }
  }, [isTimeline, replaceFilterParams, sort]);

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
    if (isMinimal || isTimeline) setMode('cinematic');
  }, [isMinimal, isTimeline, replaceFilterParams, setMode]);

  const filtersActive = isTimeline
    ? theme !== 'all'
    : sort !== 'newest' || theme !== 'all';

  const queryActive =
    filtersActive ||
    mix !== 'all' ||
    contentType !== 'film' ||
    isMinimal ||
    isTimeline;

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
  const { mix, mixes, sort, theme, themes, contentType, queryActive, clearAll } =
    useMinimalFilter();

  const mixName =
    mix === 'coming-soon'
      ? capitalizeLabel(tf('comingSoon'))
      : mixes.find((m) => m.slug === mix)?.name;

  const modeLabel = isTimeline
    ? tDisplay('timelineFull')
    : isMinimal
      ? tDisplay('minimalFull')
      : tDisplay('cinematicFull');
  const typeLabel = contentType === 'artifact' ? tf('artifact') : tDisplay('film');
  const mixLabel = mix !== 'all' && mixName ? capitalizeLabel(mixName) : tf('noMixes');
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
    clearAll,
    isMinimal,
    isTimeline,
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

