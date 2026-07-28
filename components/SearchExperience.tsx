'use client';

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  Suspense,
  type ReactNode,
} from 'react';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { parseLocale } from '@/i18n/config';

import SearchNadaView from '@/components/SearchNadaView';
import BrowseControlBar from '@/components/BrowseControlBar';
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

function highlightName(name: string, query: string) {
  const q = query.trim();
  if (!q) return name;
  const idx = name.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return name;
  return (
    <>
      <span className="text-page-muted">{name.slice(0, idx)}</span>
      <span className="text-page">{name.slice(idx, idx + q.length)}</span>
      <span className="text-page-muted">{name.slice(idx + q.length)}</span>
    </>
  );
}

/** True when the query looks like a typo of `name` (not a substring/prefix hit). */
function isTypoOnlyMatch(query: string, name: string) {
  const q = query.trim().toLowerCase();
  const n = (name || '').toLowerCase();
  if (q.length < 3 || !n) return false;
  if (n.includes(q)) return false;
  return true;
}

/** Keep a short window around the first query hit for suggestion underlines. */
function snippetAroundMatch(text: string, query: string, radius = 40): string {
  const trimmed = text.trim();
  if (!trimmed || !query) return '';
  const lower = trimmed.toLowerCase();
  const idx = lower.indexOf(query);
  if (idx < 0) return '';
  const start = Math.max(0, idx - radius);
  const end = Math.min(trimmed.length, idx + query.length + radius);
  const piece = trimmed.slice(start, end).trim();
  return `${start > 0 ? '…' : ''}${piece}${end < trimmed.length ? '…' : ''}`;
}

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
  const [didYouMean, setDidYouMean] = useState<{
    name: string;
    slug: string;
    item_type: 'film' | 'artifact';
  } | null>(null);

  const [loading, setLoading] = useState(Boolean(urlQuery.trim()));
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
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
  const contentType = minimalFilter?.contentType ?? 'all';
  const setFilterSearchActive = minimalFilter?.setSearchActive;

  useEffect(() => {
    onSearchActiveChange?.(isSearchActive);
    setFilterSearchActive?.(isSearchActive);
  }, [
    isSearchActive,
    onSearchActiveChange,
    setFilterSearchActive,
  ]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setRawResults([]);
      setDidYouMean(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const delayDebounceFn = setTimeout(async () => {
      const cleanQuery = query.toLowerCase().trim();
      const term = query.trim();
      const { data, error } = await supabase.rpc('search_items', {
        search_term: term,
        p_locale: locale,
      });

      if (!error && data) {
        const rankedResults = (data as SearchItem[]).map((item) => ({
          ...item,
          themeSlug: item.themeSlug || item.theme_slug || undefined,
          // Keep only a short window around the hit for suggestion hints.
          search_content: snippetAroundMatch(item.search_content || '', cleanQuery),
        }));
        setRawResults(rankedResults);

        let suggestion: {
          name: string;
          slug: string;
          item_type: 'film' | 'artifact';
        } | null = null;

        const asSuggestion = (item: {
          name?: string | null;
          slug?: string | null;
          item_type?: string | null;
        }) => {
          if (
            !item.name ||
            !item.slug ||
            (item.item_type !== 'film' && item.item_type !== 'artifact')
          ) {
            return null;
          }
          if (!isTypoOnlyMatch(term, item.name)) return null;
          return {
            name: item.name,
            slug: item.slug,
            item_type: item.item_type as 'film' | 'artifact',
          };
        };

        if (rankedResults.length > 0) {
          const preferred =
            rankedResults.find((item) => item.item_type === contentType) ||
            rankedResults[0];
          suggestion = asSuggestion(preferred);
        } else if (term.length >= 3) {
          const { data: sug } = await supabase.rpc('search_suggest', {
            search_term: term,
            p_locale: locale,
          });
          const row = Array.isArray(sug) ? sug[0] : null;
          if (row) suggestion = asSuggestion(row);
          // Prefer matching the active Film/Artifact dial when possible
          if (
            suggestion &&
            suggestion.item_type !== contentType &&
            Array.isArray(sug) &&
            sug.length > 1
          ) {
            const sameType = sug.find((s) => s.item_type === contentType);
            if (sameType) suggestion = asSuggestion(sameType);
          }
        }
        setDidYouMean(suggestion);
      } else {
        if (error) console.error('search_items failed:', error.message);
        setRawResults([]);
        setDidYouMean(null);
      }
      setLoading(false);
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [query, locale, contentType, supabase]);

  useEffect(() => {
    setFilteredResults(rawResults.filter((item) => item.item_type === contentType));
  }, [rawResults, contentType]);

  const suggestions = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    if (cleanQuery.length < 2) return [];
    // Use full ranked results (name, teaser, theme, etc.)
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
    urlWriteTimer.current = setTimeout(commit, 300);
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
    setDidYouMean(null);
    setLoading(false);
    writeSearchParams('', true);
    setFocused(true);
    inputRef.current?.focus();
  };

  const applyDidYouMean = (item: {
    name: string;
    slug: string;
    item_type: 'film' | 'artifact';
  }) => {
    setDidYouMean(null);
    router.push(hrefFor(item));
  };

  const hrefFor = (item: { slug: string; item_type: 'film' | 'artifact' }) =>
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
    <div className="flex w-full justify-center py-6">
      <SearchNadaView />
    </div>
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
          <div
            ref={boxRef}
            className="relative z-50 group w-full max-w-sm animate-in fade-in slide-in-from-top-3 duration-500 fill-mode-both"
          >
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-page-faint pointer-events-none transition-colors group-focus-within:text-page-muted z-10">
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
              className="w-full bg-page-chip rounded-[10px] h-12 pl-14 pr-12 font-sans font-semibold text-[16px] text-[var(--page-fg)] caret-[var(--page-fg)] placeholder-page-muted focus:bg-page-chip-active focus:outline-none focus:ring-0 focus:ring-offset-0 transition-colors duration-200 relative z-[1]"
            />
            {query && (
              <button
                onClick={handleClearSearch}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-page-faint hover:text-page transition-colors z-10"
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
                className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 rounded-[10px] border border-page-faint bg-page-elevated menu-surface shadow-[0_16px_48px_rgba(0,0,0,0.18)] py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 text-page"
              >
                {suggestions.map((item, index) => (
                  <li key={item.id} role="option" aria-selected={index === activeIndex}>
                    <Link
                      href={hrefFor(item)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={`flex items-center justify-between gap-3 px-4 py-2.5 transition-colors ${
                        index === activeIndex ? 'bg-page-chip-active' : 'hover:bg-page-chip'
                      }`}
                    >
                      <span className="min-w-0 flex flex-col gap-0.5">
                        <span className="font-sans font-semibold text-[15px] text-page truncate">
                          {highlightName(item.name, query)}
                        </span>
                        {(() => {
                          const hint = suggestionHint(item);
                          if (!hint) return null;
                          return (
                            <span className="font-sans text-[12px] text-page-faint truncate">
                              {hint}
                            </span>
                          );
                        })()}
                      </span>
                      <span className="shrink-0 font-sans text-[11px] font-medium uppercase tracking-wide text-page-faint">
                        {item.item_type === 'film' ? tSearch('film') : tSearch('artifact')}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {didYouMean && !loading && isSearchActive && (
            <p className="font-sans text-[13px] text-page-muted -mt-1">
              <button
                type="button"
                onClick={() => applyDidYouMean(didYouMean)}
                className="hover:text-page transition-colors underline-offset-2 hover:underline"
              >
                {tSearch('didYouMean', { name: didYouMean.name })}
              </button>
            </p>
          )}

          <BrowseControlBar sentinelRef={controlsSentinelRef} />
        </div>

        <StickyQueryStrip sentinelRef={controlsSentinelRef} />
      </section>

      <div
        className={`relative z-0 w-full ${
          showIdle
            ? theaterOpen
              ? 'pointer-events-none'
              : 'animate-in fade-in duration-300'
            : 'hidden'
        }`}
        aria-hidden={!showIdle}
      >
        {browseContent}
      </div>

      {!showIdle &&
        (isTimeline ? (
          <div className="relative z-0 w-full">{resultsBody}</div>
        ) : (
          <div className="relative z-0 w-full px-[10%] flex flex-col items-center mt-2">
            <div className="w-full max-w-4xl flex flex-col items-center">
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
