'use client';

import React, { useEffect, useRef, type RefObject } from 'react';
import { useTranslations } from 'next-intl';
import {
  capitalizeLabel,
  useMinimalFilterOptional,
} from '@/components/MinimalFilterContext';
import { MixesPanel } from '@/components/BrowseFilterPanels';

export type SplitSide = 'idle' | 'search' | 'mixes';

type SearchMixesSplitProps = {
  inputRef: RefObject<HTMLInputElement | null>;
  boxRef: RefObject<HTMLDivElement | null>;
  query: string;
  onQueryChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  placeholder: string;
  side: SplitSide;
  onSideChange: (side: SplitSide) => void;
};

/**
 * Mixes | Search split. Idle ≈ 50/50; activating one expands and collapses
 * the other to an icon tab.
 */
export default function SearchMixesSplit({
  inputRef,
  boxRef,
  query,
  onQueryChange,
  onClear,
  placeholder,
  side,
  onSideChange,
}: SearchMixesSplitProps) {
  const tf = useTranslations('MinimalList');
  const filter = useMinimalFilterOptional();
  const mix = filter?.mix ?? 'all';
  const mixes = filter?.mixes ?? [];

  const mixName =
    mix === 'coming-soon'
      ? capitalizeLabel(tf('comingSoon'))
      : mixes.find((m) => m.slug === mix)?.name;
  const mixesLabel =
    mix !== 'all' && mixName ? capitalizeLabel(mixName) : tf('mixes');

  const searchWins = side === 'search';
  const mixesWins = side === 'mixes';

  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (side !== 'mixes') return;
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        onSideChange(query.trim() ? 'search' : 'idle');
      }
    };
    const onKeyDownDoc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onSideChange(query.trim() ? 'search' : 'idle');
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDownDoc);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDownDoc);
    };
  }, [side, query, onSideChange]);

  const openSearch = () => {
    onSideChange('search');
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const openMixes = () => {
    inputRef.current?.blur();
    onSideChange('mixes');
  };

  const fieldShell =
    'h-12 rounded-[10px] bg-page-chip transition-colors duration-200';

  return (
    <div ref={rootRef} className="relative z-50 w-full">
      <div ref={boxRef} className="flex w-full items-stretch gap-2">
        {/* Mixes field — first */}
        <div
          className={`relative flex items-center min-w-0 overflow-hidden transition-[flex] duration-300 ease-out ${fieldShell} ${
            searchWins
              ? 'flex-[0_0_3rem]'
              : mixesWins
                ? 'flex-1 bg-page-chip-active'
                : 'flex-1'
          }`}
        >
          {searchWins ? (
            <button
              type="button"
              aria-label={tf('mixes')}
              title={tf('mixes')}
              onClick={openMixes}
              className="relative w-full h-full flex items-center justify-center text-page-faint hover:text-page-muted transition-colors"
            >
              <MixesGlyph />
              {mix !== 'all' && (
                <span
                  className="absolute top-2.5 right-2 w-1.5 h-1.5 rounded-full bg-[#0071E3] dark:bg-[#ffd446]"
                  aria-hidden
                />
              )}
            </button>
          ) : (
            <>
              <button
                type="button"
                aria-expanded={side === 'mixes'}
                aria-label={tf('mixes')}
                onClick={openMixes}
                className={`w-full h-full pl-4 flex items-center gap-3 font-sans font-semibold text-[15px] transition-colors ${
                  mix !== 'all' ? 'pr-10' : 'pr-3'
                } ${
                  side === 'mixes' || mix !== 'all'
                    ? 'text-page'
                    : 'text-page-muted hover:text-page'
                }`}
              >
                <span className="shrink-0 text-page-faint">
                  <MixesGlyph />
                </span>
                <span className="min-w-0 flex-1 truncate text-left">
                  {mixesLabel}
                </span>
              </button>
              {mix !== 'all' && filter?.clearMix ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    filter.clearMix();
                    if (side === 'mixes') {
                      onSideChange(query.trim() ? 'search' : 'idle');
                    }
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-page-faint hover:text-page transition-colors z-10"
                  aria-label={tf('clear')}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              ) : null}
            </>
          )}
        </div>
        {/* Search field */}
        <div
          className={`relative flex items-center min-w-0 overflow-hidden transition-[flex] duration-300 ease-out ${fieldShell} ${
            mixesWins
              ? 'flex-[0_0_3rem]'
              : 'flex-1 focus-within:bg-page-chip-active'
          }`}
        >
          {mixesWins ? (
            <button
              type="button"
              aria-label={placeholder}
              onClick={openSearch}
              className="w-full h-full flex items-center justify-center text-page-faint hover:text-page-muted transition-colors"
            >
              <SearchGlyph />
            </button>
          ) : (
            <>
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-page-faint pointer-events-none z-10">
                <SearchGlyph />
              </span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={onQueryChange}
                onFocus={() => onSideChange('search')}
                placeholder={placeholder}
                className="w-full h-full bg-transparent pl-12 pr-10 font-sans font-semibold text-[16px] text-[var(--page-fg)] caret-[var(--page-fg)] placeholder-page-muted focus:outline-none focus:ring-0"
              />
              {query ? (
                <button
                  type="button"
                  onClick={onClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-page-faint hover:text-page transition-colors z-10"
                  aria-label="Clear search"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>

      {side === 'mixes' && (
        <div className="mt-2 w-full animate-in fade-in slide-in-from-top-1 duration-150">
          <MixesPanel
            onDone={() => onSideChange(query.trim() ? 'search' : 'idle')}
          />
        </div>
      )}
    </div>
  );
}

function SearchGlyph() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

/** Lightning mark — same footprint / stroke as search. */
function MixesGlyph() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"
      />
    </svg>
  );
}
