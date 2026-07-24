'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useTranslations } from 'next-intl';

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
  /** Called whenever search goes from empty ↔ active (trimmed query length > 0). */
  onSearchActiveChange?: (active: boolean) => void;
  className?: string;
};

function highlightName(name: string, query: string) {
  const q = query.trim();
  if (!q) return name;
  const idx = name.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return name;
  return (
    <>
      {name.slice(0, idx)}
      <span className="text-white">{name.slice(idx, idx + q.length)}</span>
      {name.slice(idx + q.length)}
    </>
  );
}

function SearchContent({ onSearchActiveChange, className }: SearchExperienceProps) {
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
  const [loading, setLoading] = useState(Boolean(urlQuery.trim()));
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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
        .or(
          [
            `name.ilike.%${query}%`,
            `teaser.ilike.%${query}%`,
            `search_content.ilike.%${query}%`,
            `theme.ilike.%${query}%`,
            `label.ilike.%${query}%`,
            `creator.ilike.%${query}%`,
            `rating.ilike.%${query}%`,
          ].join(',')
        )
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
          if ((a.theme || '').toLowerCase().includes(cleanQuery)) scoreA += 20;
          if ((b.theme || '').toLowerCase().includes(cleanQuery)) scoreB += 20;
          if ((a.label || '').toLowerCase().includes(cleanQuery)) scoreA += 18;
          if ((b.label || '').toLowerCase().includes(cleanQuery)) scoreB += 18;
          if ((a.creator || '').toLowerCase().includes(cleanQuery)) scoreA += 18;
          if ((b.creator || '').toLowerCase().includes(cleanQuery)) scoreB += 18;
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

  const suggestions = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    if (cleanQuery.length < 2) return [];
    // Use full ranked results (name, teaser, search_content / transcript, theme, etc.)
    return filteredResults.slice(0, 5);
  }, [filteredResults, query]);

  const suggestionHint = (item: SearchItem) => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    if ((item.name || '').toLowerCase().includes(q)) return null;

    const fields: Array<{ label?: string; value?: string | null }> = [
      { value: item.theme },
      { value: item.label },
      { value: item.creator },
      { value: item.rating },
      { value: item.teaser },
      { value: item.search_content },
    ];

    for (const field of fields) {
      const text = (field.value || '').trim();
      if (!text) continue;
      const lower = text.toLowerCase();
      const idx = lower.indexOf(q);
      if (idx < 0) continue;

      // Short context snippet around the match for long fields (transcript / teaser).
      if (text.length > 48) {
        const start = Math.max(0, idx - 18);
        const end = Math.min(text.length, idx + q.length + 24);
        const snippet = `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
        return snippet;
      }
      return text;
    }
    return null;
  };

  const showSuggestions = focused && query.trim().length >= 2 && suggestions.length > 0;

  useEffect(() => {
    setActiveIndex(-1);
  }, [query, showSuggestions]);

  useEffect(() => {
    if (!showSuggestions) return;
    const onPointerDown = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [showSuggestions]);

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
    setFocused(true);
    inputRef.current?.focus();
  };

  const hrefFor = (item: SearchItem) =>
    item.item_type === 'film' ? `/film/${item.slug}` : `/artifact/${item.slug}`;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      router.push(hrefFor(suggestions[activeIndex]));
    } else if (e.key === 'Escape') {
      setFocused(false);
      setActiveIndex(-1);
    }
  };

  const showIdle = !isSearchActive && !loading;

  return (
    <div className={className ?? 'w-full max-w-4xl flex flex-col items-center gap-8'}>
      <div className="w-full flex flex-col items-center gap-4">
        <div
          ref={boxRef}
          className="relative z-50 group w-full max-w-sm animate-in fade-in slide-in-from-top-3 duration-500 fill-mode-both"
        >
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none transition-colors group-focus-within:text-white/80 z-10">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={tSearch('placeholder')}
            role="combobox"
            aria-expanded={showSuggestions}
            aria-controls="search-suggestions"
            aria-autocomplete="list"
            className="w-full bg-white/5 rounded-[10px] h-14 pl-14 pr-12 font-sans font-semibold text-[16px] text-white placeholder-white/55 focus:bg-white/10 focus:outline-none focus:ring-0 focus:ring-offset-0 transition-all duration-300 shadow-2xl relative z-[1]"
          />
          {query && (
            <button
              onClick={handleClearSearch}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors z-10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {showSuggestions && (
            <ul
              id="search-suggestions"
              role="listbox"
              className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 rounded-[10px] border border-white/10 bg-[#1F1F1F] shadow-[0_16px_48px_rgba(0,0,0,0.55)] py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
            >
              {suggestions.map((item, index) => (
                <li key={item.id} role="option" aria-selected={index === activeIndex}>
                  <Link
                    href={hrefFor(item)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`flex items-center justify-between gap-3 px-4 py-2.5 transition-colors ${
                      index === activeIndex ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <span className="min-w-0 flex flex-col gap-0.5">
                      <span className="font-sans font-semibold text-[15px] text-white/75 truncate">
                        {highlightName(item.name, query)}
                      </span>
                      {(() => {
                        const hint = suggestionHint(item);
                        if (!hint) return null;
                        return (
                          <span className="font-sans text-[12px] text-white/35 truncate">
                            {hint}
                          </span>
                        );
                      })()}
                    </span>
                    <span className="shrink-0 font-sans text-[11px] font-medium uppercase tracking-wide text-white/35">
                      {item.item_type === 'film' ? tSearch('film') : tSearch('artifact')}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="relative z-0 flex items-center justify-center gap-2">
          <DisplayModeToggle />
          <MinimalFilterButton />
        </div>
      </div>

      {!showIdle && (
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
      )}
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
