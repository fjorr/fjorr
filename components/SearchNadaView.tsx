'use client';

import React, { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useMinimalFilterOptional } from '@/components/MinimalFilterContext';
import { mixIdsForType } from '@/lib/home-mix';

/**
 * Empty browse/search — one quiet line under the controls.
 * When the other content type has hits, offer a switch sentence.
 */
export default function SearchNadaView({
  category,
  showNominate,
}: {
  category?: 'film' | 'artifact';
  /** Defaults to true for films, false for artifacts. */
  showNominate?: boolean;
} = {}) {
  const t = useTranslations('Search');
  const tf = useTranslations('MinimalList');
  const filter = useMinimalFilterOptional();
  const type = category ?? filter?.contentType ?? 'film';
  const nominate = showNominate ?? type === 'film';

  const otherHits = useMemo(() => {
    if (!filter) return 0;
    const { searchActive, searchTypeHits, mix, mixes } = filter;
    if (searchActive) {
      return type === 'artifact'
        ? searchTypeHits.film
        : searchTypeHits.artifact;
    }
    if (mix === 'all' || mix === 'coming-soon') return 0;
    const selected = mixes.find((m) => m.slug === mix);
    if (!selected) return 0;
    return type === 'artifact'
      ? mixIdsForType(selected, 'film').length
      : mixIdsForType(selected, 'artifact').length;
  }, [filter, type]);

  const switchToOther = () => {
    filter?.setContentType(type === 'artifact' ? 'film' : 'artifact');
  };

  return (
    <div className="w-full min-h-[4.5rem] pt-2 pb-8 flex flex-col items-center justify-start text-center gap-2">
      <p className="font-sans text-[14px] font-medium text-page-muted">
        {type === 'artifact' ? tf('noArtifactMatches') : tf('noFilmMatches')}
      </p>
      {otherHits > 0 ? (
        <button
          type="button"
          onClick={switchToOther}
          className="font-sans text-[13px] font-semibold tracking-tight text-page-faint hover:text-page transition-colors underline-offset-2 hover:underline"
        >
          {type === 'artifact'
            ? tf('seeFilmMatches', { count: otherHits })
            : tf('seeArtifactMatches', { count: otherHits })}
        </button>
      ) : nominate ? (
        <Link
          href="/nominate"
          className="font-sans text-[13px] font-semibold tracking-tight text-page-faint hover:text-page transition-colors"
        >
          {t('nominateStory')}
        </Link>
      ) : null}
    </div>
  );
}
