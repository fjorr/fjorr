'use client';

import React, { useState, useEffect, useRef, Suspense, type ReactNode } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useTranslations } from 'next-intl';

import SearchIdleView from '@/components/SearchIdleView';
import SearchResultsGrid from '@/components/SearchResultsGrid';
import SearchResultsMinimal from '@/components/SearchResultsMinimal';
import SearchNadaView from '@/components/SearchNadaView';
import DisplayModeToggle from '@/components/DisplayModeToggle';
import { MinimalFilterButton, useMinimalFilterOptional } from '@/components/MinimalFilterContext';
import { useDisplayMode } from '@/components/DisplayModeProvider';

export interface SearchItem {
  id: string;
  internal_id: string;
  item_type: 'film' | 'artifact';
  slug: string;
  name: string;
  teaser: string;
  blok_tall: string;
  search_content: string;
  release_date: string;
  rating?: string;
  theme?: string;
  runtime?: number;
  label?: string;
  creator?: string;
}

type SearchExperienceProps = {
  /** When set, replaces the default "Latest Releases" idle list while the query is empty. */
  idleContent?: ReactNode;
  /** Called whenever search goes from empty ↔ active (trimmed query length > 0). */
  onSearchActiveChange?: (active: boolean) => void;
  className?: string;
};

function SearchContent({
  idleContent,
  onSearchActiveChange,
  className,
}: SearchExperienceProps) {
  const { isMinimal } = useDisplayMode();
  const minimalFilter = useMinimalFilterOptional();
  const tSearch = useTranslations('Search');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const urlQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(urlQuery);
  const [rawResults, setRawResults] = useState<SearchItem[]>([]);
  const [filteredResults, setFilteredResults] = useState<SearchItem[]>([]);
  const [latestItems, setLatestItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(Boolean(urlQuery.trim()));
  const inputRef = useRef<HTMLInputElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Keep input in sync with the URL (browser back/forward).
  useEffect(() => {
    setQuery(urlQuery);
    if (!urlQuery.trim()) setLoading(false);
  }, [urlQuery]);

  const isSearchActive = query.trim().length > 0;
  const contentType = minimalFilter?.contentType ?? 'all';
  const setFilterSearchActive = minimalFilter?.setSearchActive;
  const setFilterContentType = minimalFilter?.setContentType;

  useEffect(() => {
    onSearchActiveChange?.(isSearchActive);
    setFilterSearchActive?.(isSearchActive);
    if (!isSearchActive && contentType !== 'all') {
      setFilterContentType?.('all');
    }
  }, [
    isSearchActive,
    contentType,
    onSearchActiveChange,
    setFilterSearchActive,
    setFilterContentType,
  ]);

  const SEARCH_SELECT =
    'id, internal_id, item_type, slug, name, teaser, blok_tall, search_content, release_date, rating, theme, runtime, label, creator';

  useEffect(() => {
    // Home preview supplies its own idle rails — skip the "latest" fetch there.
    if (idleContent !== undefined) return;

    async function fetchLatest() {
      const currentIsoString = new Date().toISOString();
      const { data } = await supabase
        .from('search')
        .select(SEARCH_SELECT)
        .lte('release_date', currentIsoString)
        .order('release_date', { ascending: false })
        .limit(5);

      if (data) setLatestItems(data as SearchItem[]);
    }
    fetchLatest();
  }, [idleContent]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setRawResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const delayDebounceFn = setTimeout(async () => {
      const { data, error } = await supabase
        .from('search')
        .select(SEARCH_SELECT)
        .or(`name.ilike.%${query}%,teaser.ilike.%${query}%,search_content.ilike.%${query}%`)
        .limit(40);

      if (!error && data) {
        const cleanQuery = query.toLowerCase().trim();
        const rankedResults = (data as SearchItem[]).sort((a, b) => {
          let scoreA = 0;
          let scoreB = 0;
          const nameA = (a.name || '').toLowerCase();
          const nameB = (b.name || '').toLowerCase();
          const teaserA = (a.teaser || '').toLowerCase();
          const teaserB = (b.teaser || '').toLowerCase();
          const contentA = (a.search_content || '').toLowerCase();
          const contentB = (b.search_content || '').toLowerCase();

          if (nameA === cleanQuery) scoreA += 100;
          if (nameB === cleanQuery) scoreB += 100;
          if (nameA.startsWith(cleanQuery)) scoreA += 60;
          if (nameB.startsWith(cleanQuery)) scoreB += 60;
          if (nameA.includes(cleanQuery)) scoreA += 30;
          if (nameB.includes(cleanQuery)) scoreB += 30;
          if (teaserA.includes(cleanQuery)) scoreA += 15;
          if (teaserB.includes(cleanQuery)) scoreB += 15;
          if (contentA.includes(cleanQuery)) scoreA += 5;
          if (contentB.includes(cleanQuery)) scoreB += 5;

          if (scoreA === scoreB) {
            const timeA = a.release_date ? new Date(a.release_date).getTime() : 0;
            const timeB = b.release_date ? new Date(b.release_date).getTime() : 0;
            return timeB - timeA;
          }
          return scoreB - scoreA;
        });

        setRawResults(rankedResults);
      } else {
        setRawResults([]);
      }
      setLoading(false);
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  useEffect(() => {
    if (contentType === 'all') {
      setFilteredResults(rawResults);
    } else {
      setFilteredResults(rawResults.filter((item) => item.item_type === contentType));
    }
  }, [rawResults, contentType]);

  const writeSearchParams = (nextQuery: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextQuery.trim()) {
      params.set('q', nextQuery);
    } else {
      params.delete('q');
      params.delete('type');
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim()) setLoading(true);
    else setLoading(false);
    writeSearchParams(val);
  };

  const handleClearSearch = () => {
    setQuery('');
    setFilterContentType?.('all');
    setLoading(false);
    writeSearchParams('');
  };

  return (
    <div className={className ?? 'w-full max-w-4xl flex flex-col items-center gap-8'}>
      <div className="w-full flex flex-col items-center gap-4">
        <div className="relative group w-full max-w-sm animate-in fade-in slide-in-from-top-3 duration-500 fill-mode-both [transform:translateZ(0)] [backface-visibility:hidden]">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none transition-colors group-focus-within:text-white/80">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder={tSearch('placeholder')}
            className="w-full bg-white/5 rounded-[10px] h-14 pl-14 pr-12 font-sans font-semibold text-[16px] text-white placeholder-white/55 focus:bg-white/10 focus:outline-none focus:ring-0 focus:ring-offset-0 transition-all duration-300 shadow-2xl"
          />
          {query && (
            <button
              onClick={handleClearSearch}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex items-center justify-center gap-2">
          <DisplayModeToggle />
          <MinimalFilterButton />
        </div>
      </div>

      {(() => {
        const idleNode =
          idleContent !== undefined ? idleContent : (
            <SearchIdleView latestItems={latestItems} />
          );
        const showIdle = !isSearchActive && !loading;
        // Home passes idleContent={null} — skip the results row entirely when idle.
        if (showIdle && idleNode == null) return null;

        return (
          <div className="w-full mt-6 flex flex-col items-center">
            {loading ? (
              isMinimal ? (
                <div className="w-full max-w-[600px] flex flex-col gap-6 animate-pulse">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="flex flex-col gap-2">
                      <div className="h-5 bg-white/10 rounded w-1/3" />
                      <div className="h-4 bg-white/5 rounded w-2/3" />
                      <div className="h-3 bg-white/5 rounded w-1/4" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-10 animate-pulse">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="flex flex-col gap-3">
                      <div className="w-full aspect-[2/3] bg-white/5 rounded-[8px]" />
                      <div className="h-4 bg-white/10 rounded w-2/3" />
                      <div className="h-3 bg-white/5 rounded w-full" />
                    </div>
                  ))}
                </div>
              )
            ) : showIdle ? (
              idleNode
            ) : filteredResults.length > 0 ? (
              isMinimal ? (
                <SearchResultsMinimal results={filteredResults} />
              ) : (
                <SearchResultsGrid results={filteredResults} />
              )
            ) : (
              <SearchNadaView />
            )}
          </div>
        );
      })()}
    </div>
  );
}

export default function SearchExperience(props: SearchExperienceProps) {
  return (
    <Suspense
      fallback={
        <div className="text-white/20 font-sans text-sm mt-12 animate-pulse">
          Loading search…
        </div>
      }
    >
      <SearchContent {...props} />
    </Suspense>
  );
}
