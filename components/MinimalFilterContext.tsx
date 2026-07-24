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

export type MinimalSortMode = 'newest' | 'az' | 'runtime';
export type MinimalShowMode = 'all' | 'available' | 'comingSoon';
export type MinimalContentType = 'all' | 'film' | 'artifact';

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
  searchActive: boolean;
  setSearchActive: (value: boolean) => void;
  filtersActive: boolean;
  clearFilters: () => void;
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
  if (value === 'film' || value === 'artifact' || value === 'all') return value;
  return 'all';
}

export function MinimalFilterProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sort = parseSort(searchParams.get('sort'));
  const show = parseShow(searchParams.get('show'));
  const theme = searchParams.get('theme') || 'all';
  const contentType = parseContentType(searchParams.get('type'));

  const [themes, setThemes] = useState<string[]>([]);
  const [searchActive, setSearchActive] = useState(false);

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
      replaceFilterParams({ type: value === 'all' ? null : value });
    },
    [replaceFilterParams]
  );

  const clearFilters = useCallback(() => {
    replaceFilterParams({
      sort: null,
      show: null,
      theme: null,
      type: null,
    });
  }, [replaceFilterParams]);

  const filtersActive =
    sort !== 'newest' || show !== 'all' || theme !== 'all' || contentType !== 'all';

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
      searchActive,
      setSearchActive,
      filtersActive,
      clearFilters,
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
      searchActive,
      filtersActive,
      clearFilters,
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

/** Filter control — sits next to the cinematic/minimal toggle. */
export function MinimalFilterButton() {
  const { isMinimal } = useDisplayMode();
  const tf = useTranslations('MinimalList');
  const {
    sort,
    setSort,
    show,
    setShow,
    theme,
    setTheme,
    themes,
    contentType,
    setContentType,
    searchActive,
    filtersActive,
    clearFilters,
  } = useMinimalFilter();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Cinematic browse uses rails; filter applies to minimal browse + any search.
  const visible = isMinimal || searchActive;

  useEffect(() => {
    if (!visible) setOpen(false);
  }, [visible]);

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

  if (!visible) return null;

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`h-8 px-3 rounded-[6px] font-sans text-xs font-semibold transition-colors inline-flex items-center gap-1.5 ${
          open || filtersActive
            ? 'bg-white/15 text-white'
            : 'bg-white/5 text-white/55 hover:text-white/80 hover:bg-white/10'
        }`}
        aria-expanded={open}
      >
        {tf('filter')}
        {filtersActive && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#ffd446]" aria-hidden />
        )}
      </button>

      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+8px)] z-30 w-[min(100vw-2.5rem,320px)] rounded-[10px] border border-white/10 bg-[#1F1F1F]/95 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.45)] p-4 flex flex-col gap-4">
          {searchActive && (
            <div className="flex flex-col gap-2">
              <p className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
                {tf('type')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <OptionButton
                  active={contentType === 'all'}
                  onClick={() => setContentType('all')}
                >
                  {tf('all')}
                </OptionButton>
                <OptionButton
                  active={contentType === 'film'}
                  onClick={() => setContentType('film')}
                >
                  {tf('films')}
                </OptionButton>
                <OptionButton
                  active={contentType === 'artifact'}
                  onClick={() => setContentType('artifact')}
                >
                  {tf('artifacts')}
                </OptionButton>
              </div>
            </div>
          )}

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
              <OptionButton active={sort === 'runtime'} onClick={() => setSort('runtime')}>
                {tf('runtime')}
              </OptionButton>
            </div>
          </div>

          {contentType !== 'artifact' && (
            <div className="flex flex-col gap-2">
              <p className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
                {tf('show')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <OptionButton active={show === 'all'} onClick={() => setShow('all')}>
                  {tf('all')}
                </OptionButton>
                <OptionButton active={show === 'available'} onClick={() => setShow('available')}>
                  {tf('available')}
                </OptionButton>
                <OptionButton active={show === 'comingSoon'} onClick={() => setShow('comingSoon')}>
                  {tf('comingSoon')}
                </OptionButton>
              </div>
            </div>
          )}

          {contentType !== 'artifact' && themes.length > 0 && (
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
                    {name}
                  </OptionButton>
                ))}
              </div>
            </div>
          )}

          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
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
