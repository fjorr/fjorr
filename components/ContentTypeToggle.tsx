'use client';

import React, { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useMinimalFilter } from '@/components/MinimalFilterContext';
import { mixIdsForType } from '@/lib/home-mix';

function TypeLabel({
  label,
  count,
}: {
  label: string;
  count: number | null;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{label}</span>
      {count != null ? (
        <span className="font-sans font-medium tabular-nums tracking-tight">
          {count}
        </span>
      ) : null}
    </span>
  );
}

/** Films / Artifacts switch — left of Cine / Mini / Time. */
export default function ContentTypeToggle() {
  const t = useTranslations('DisplayMode');
  const {
    contentType,
    setContentType,
    searchActive,
    searchTypeHits,
    mix,
    mixes,
  } = useMinimalFilter();

  const mixHits = useMemo(() => {
    if (mix === 'all' || mix === 'coming-soon') return null;
    const selected = mixes.find((m) => m.slug === mix);
    if (!selected) return null;
    return {
      film: mixIdsForType(selected, 'film').length,
      artifact: mixIdsForType(selected, 'artifact').length,
    };
  }, [mix, mixes]);

  const hits = searchActive ? searchTypeHits : mixHits;

  return (
    <div className="inline-flex shrink-0 items-center gap-0.5 rounded-[8px] p-0.5 bg-page-chip">
      <button
        type="button"
        onClick={() => setContentType('film')}
        className={`h-8 inline-flex items-center gap-0 font-sans text-xs font-semibold px-2.5 sm:px-3 rounded-[6px] transition-colors whitespace-nowrap ${
          contentType === 'film'
            ? 'bg-page-chip-active text-page'
            : 'text-page-faint hover:text-page-muted'
        }`}
      >
        <TypeLabel label={t('film')} count={hits?.film ?? null} />
      </button>
      <button
        type="button"
        onClick={() => setContentType('artifact')}
        className={`h-8 inline-flex items-center gap-0 font-sans text-xs font-semibold px-2.5 sm:px-3 rounded-[6px] transition-colors whitespace-nowrap ${
          contentType === 'artifact'
            ? 'bg-page-chip-active text-page'
            : 'text-page-faint hover:text-page-muted'
        }`}
      >
        <TypeLabel label={t('artifact')} count={hits?.artifact ?? null} />
      </button>
    </div>
  );
}
