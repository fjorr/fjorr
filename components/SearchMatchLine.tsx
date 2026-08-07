'use client';

import React, { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  searchMatchSnippet,
  type MatchSnippet,
} from '@/lib/search-match-snippet';

function HighlightedSnippet({ snippet }: { snippet: MatchSnippet }) {
  const { text, matchIndex, matchLength } = snippet;
  if (matchIndex < 0 || matchLength <= 0) {
    return <>{text}</>;
  }
  const end = Math.min(text.length, matchIndex + matchLength);
  return (
    <>
      {text.slice(0, matchIndex)}
      <mark className="bg-page-chip text-page rounded-[2px] px-0.5">
        {text.slice(matchIndex, end)}
      </mark>
      {text.slice(end)}
    </>
  );
}

/** Super-small match excerpt under a search result. */
export default function SearchMatchLine({
  item,
  query: queryProp,
  className = '',
}: {
  item: {
    name?: string | null;
    teaser?: string | null;
    search_content?: string | null;
    creator?: string | null;
    theme?: string | null;
    label?: string | null;
  };
  /** Prefer live search state — URL `?q=` can lag behind results. */
  query?: string;
  className?: string;
}) {
  const searchParams = useSearchParams();
  const query = (queryProp ?? searchParams.get('q') ?? '').trim();

  const snippet = useMemo(
    () => searchMatchSnippet(item, query),
    [item, query]
  );

  if (!snippet) return null;

  return (
    <p
      className={`font-sans text-[12px] font-medium leading-snug text-page-muted line-clamp-1 ${className}`}
      title={snippet.text}
    >
      <HighlightedSnippet snippet={snippet} />
    </p>
  );
}
