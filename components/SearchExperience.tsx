'use client';

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  Suspense,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { parseLocale } from '@/i18n/config';

import SearchNadaView from '@/components/SearchNadaView';
import BrowseControlBar from '@/components/BrowseControlBar';
import MixHeroTitle from '@/components/MixHeroTitle';
import SearchMixesSplit, {
  type SplitSide,
} from '@/components/SearchMixesSplit';
import { useMinimalFilterOptional } from '@/components/MinimalFilterContext';
import { useDisplayMode } from '@/components/DisplayModeProvider';
import StickyQueryStrip from '@/components/StickyQueryStrip';
import { createClient } from '@/lib/supabase/client';

const SearchResultsGrid = dynamic(() => import('@/components/SearchResultsGrid'));
const SearchResultsMinimal = dynamic(() => import('@/components/SearchResultsMinimal'));
const SearchResultsTimeline = dynamic(() => import('@/components/SearchResultsTimeline'));

export interface SearchItem {
  id: string;
  internal_id: string;
  item_type: 'film' | 'artifact';
  slug: string;
  name: string;
  teaser: string;
  blok_tall: string;
  search_content?: string;
  release_date: string;
  rating?: string;
  theme?: string;
  /** CamelCase (home browse) or snake_case (Supabase search rows). */
  themeSlug?: string;
  theme_slug?: string;
  runtime?: number;
  label?: string;
  creator?: string;
}

type SearchExperienceProps = {
  /** Home browse rails / lists — shown when the query is empty. */
  browseContent?: ReactNode;
  /** Hide chrome while the cinema theater is open. */
  theaterOpen?: boolean;
  /** Called whenever search goes from empty ↔ active (trimmed query length > 0). */
  onSearchActiveChange?: (active: boolean) => void;
  className?: string;
};

function SearchContent({
  browseContent,
  theaterOpen = false,
  onSearchActiveChange,
  className,
}: SearchExperienceProps) {
  const { isMinimal, isTimeline } = useDisplayMode();
  const minimalFilter = useMinimalFilterOptional();
  const tSearch = useTranslations('Search');
  const locale = parseLocale(useLocale());
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const urlQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(urlQuery);
  const [rawResults, setRawResults] = useState<SearchItem[]>([]);
  const [filteredResults, setFilteredResults] = useState<SearchItem[]>([]);

  const [loading, setLoading] = useState(Boolean(urlQuery.trim()));
  const [splitSide, setSplitSide] = useState<SplitSide>(
    urlQuery.trim() ? 'search' : 'idle'
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const controlsSentinelRef = useRef<HTMLDivElement>(null);
  const urlWriteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    setQuery(urlQuery);
    if (!urlQuery.trim()) setLoading(false);
  }, [urlQuery]);

  const isSearchActive = query.trim().length > 0;
  const contentType = minimalFilter?.contentType ?? 'film';
  const setFilterSearchActive = minimalFilter?.setSearchActive;
  const setSearchTypeHits = minimalFilter?.setSearchTypeHits;

  useEffect(() => {
    onSearchActiveChange?.(isSearchActive);
    setFilterSearchActive?.(isSearchActive);
  }, [
    isSearchActive,
    onSearchActiveChange,
    setFilterSearchActive,
  ]);

  useEffect(() => {
    if (!query.trim()) {
      setRawResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    let cancelled = false;

    const delayDebounceFn = setTimeout(async () => {
      const term = query.trim();
      try {
        const { data, error } = await supabase.rpc('search_items', {
          search_term: term,
          p_locale: locale,
        });
        if (cancelled || controller.signal.aborted) return;

        if (!error && data) {
          const rankedResults = (data as SearchItem[]).map((item) => ({
            ...item,
            themeSlug: item.themeSlug || item.theme_slug || undefined,
          }));
          setRawResults(rankedResults);
        } else {
          if (error) console.error('search_items failed:', error.message);
          setRawResults([]);
        }
      } finally {
        if (!cancelled && !controller.signal.aborted) setLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(delayDebounceFn);
    };
  }, [query, locale, supabase]);

  useEffect(() => {
    setFilteredResults(rawResults.filter((item) => item.item_type === contentType));
  }, [rawResults, contentType]);

  useEffect(() => {
    if (!setSearchTypeHits) return;
    if (!isSearchActive || loading) {
      if (!isSearchActive) setSearchTypeHits({ film: 0, artifact: 0 });
      return;
    }
    let film = 0;
    let artifact = 0;
    for (const item of rawResults) {
      if (item.item_type === 'film') film += 1;
      else if (item.item_type === 'artifact') artifact += 1;
    }
    setSearchTypeHits({ film, artifact });
  }, [isSearchActive, loading, rawResults, setSearchTypeHits]);

  const effectiveSplit: SplitSide = isSearchActive ? 'search' : splitSide;

  const writeSearchParams = (nextQuery: string, immediate = false) => {
    const commit = () => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextQuery.trim()) {
        params.set('q', nextQuery);
      } else {
        // Drop query only — keep mix / type / dials so browse state survives clear.
        params.delete('q');
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    };

    if (urlWriteTimer.current) clearTimeout(urlWriteTimer.current);
    if (immediate) {
      commit();
      return;
    }
    urlWriteTimer.current = setTimeout(commit, 800);
  };

  useEffect(() => {
    return () => {
      if (urlWriteTimer.current) clearTimeout(urlWriteTimer.current);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim()) setLoading(true);
    else setLoading(false);
    writeSearchParams(val);
  };

  const handleClearSearch = () => {
    setQuery('');
    setLoading(false);
    writeSearchParams('', true);
    setSplitSide('search');
    inputRef.current?.focus();
  };

  const showIdle = !isSearchActive && !loading;

  const resultsBody = loading ? (
    isTimeline ? (
      <div className="relative w-full mt-6 animate-pulse">
        <div
          className="pointer-events-none absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-page-line"
          aria-hidden
        />
        <div className="mx-auto w-full max-w-sm">
          <div className="flex justify-center py-10">
            <div className="h-6 w-16 rounded bg-page-chip" />
          </div>
          <div className="flex flex-col gap-12">
            {[1, 2, 3].map((n) => (
              <div key={n} className="grid grid-cols-2 gap-x-8 md:gap-x-10 items-start">
                <div className="flex justify-end">
                  <div className="w-[72px] sm:w-[80px] aspect-[2/3] rounded-[10px] bg-page-chip" />
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <div className="h-4 bg-page-chip rounded w-3/4" />
                  <div className="h-3 bg-page-chip rounded w-full opacity-70" />
                  <div className="h-3 bg-page-chip rounded w-5/6 opacity-70" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ) : isMinimal ? (
      <div className="w-full max-w-[600px] flex flex-col gap-6 animate-pulse">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex flex-col gap-2">
            <div className="h-5 bg-page-chip rounded w-1/3" />
            <div className="h-4 bg-page-chip rounded w-2/3 opacity-70" />
            <div className="h-3 bg-page-chip rounded w-1/4 opacity-50" />
          </div>
        ))}
      </div>
    ) : (
      <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-10 animate-pulse">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="flex flex-col gap-3">
            <div className="w-full aspect-[2/3] bg-page-chip rounded-[8px]" />
            <div className="h-4 bg-page-chip rounded w-2/3" />
            <div className="h-3 bg-page-chip rounded w-full opacity-70" />
          </div>
        ))}
      </div>
    )
  ) : filteredResults.length > 0 ? (
    isTimeline ? (
      <SearchResultsTimeline results={filteredResults} />
    ) : isMinimal ? (
      <SearchResultsMinimal results={filteredResults} />
    ) : (
      <SearchResultsGrid results={filteredResults} />
    )
  ) : (
    <SearchNadaView />
  );

  return (
    <>
      <section
        className={`relative z-30 w-full pt-4 pb-4 px-[10%] flex flex-col items-center ${
          theaterOpen ? 'invisible pointer-events-none' : ''
        }`}
        aria-hidden={theaterOpen}
      >
        <div
          className={
            className ?? 'w-full max-w-4xl flex flex-col items-center gap-4'
          }
        >
          <div className="relative w-full max-w-sm flex flex-col items-stretch">
            <SearchMixesSplit
              inputRef={inputRef}
              boxRef={boxRef}
              query={query}
              onQueryChange={handleInputChange}
              onClear={handleClearSearch}
              placeholder={tSearch('placeholder')}
              side={effectiveSplit}
              onSideChange={setSplitSide}
            />
          </div>

          <BrowseControlBar sentinelRef={controlsSentinelRef} />
        </div>

        <StickyQueryStrip sentinelRef={controlsSentinelRef} />
      </section>

      {showIdle ? (
        <div
          className={`relative z-0 w-full ${
            theaterOpen
              ? 'pointer-events-none'
              : 'animate-in fade-in duration-300'
          }`}
          aria-hidden={theaterOpen}
        >
          {browseContent}
        </div>
      ) : null}

      {!showIdle &&
        (isTimeline ? (
          <div className="relative z-0 w-full">
            <div className="w-full px-5 sm:px-8 md:px-16 mt-6 md:mt-8 mb-5 md:mb-6">
              <div className="w-full max-w-[1440px] mx-auto">
                <MixHeroTitle query={query} className="text-center" />
              </div>
            </div>
            {resultsBody}
          </div>
        ) : (
          <div className="relative z-0 w-full px-[10%] flex flex-col items-center mt-2">
            <div
              className={`w-full flex flex-col items-stretch ${
                isMinimal ? 'max-w-[600px]' : 'max-w-4xl'
              }`}
            >
              <div className="mt-4 md:mt-6 mb-5 md:mb-6">
                <MixHeroTitle query={query} />
              </div>
              {resultsBody}
            </div>
          </div>
        ))}
    </>
  );
}

function SearchLoadingFallback() {
  const t = useTranslations('Search');
  return (
    <div className="text-page-faint font-sans text-sm mt-12 animate-pulse">
      {t('loading')}
    </div>
  );
}

export default function SearchExperience(props: SearchExperienceProps) {
  return (
    <Suspense fallback={<SearchLoadingFallback />}>
      <SearchContent {...props} />
    </Suspense>
  );
}
