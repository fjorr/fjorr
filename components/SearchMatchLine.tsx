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

/** Super-small match excerpt under a search result (reads `?q=`). */
export default function SearchMatchLine({
  item,
  className = '',
}: {
  item: {
    name?: string | null;
    teaser?: string | null;
    search_content?: string | null;
  };
  className?: string;
}) {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const snippet = useMemo(
    () => searchMatchSnippet(item, query),
    [item, query]
  );

  if (!snippet) return null;

  return (
    <p
      className={`font-sans text-[11px] font-normal leading-snug text-page-faint line-clamp-1 ${className}`}
    >
      <HighlightedSnippet snippet={snippet} />
    </p>
  );
}
