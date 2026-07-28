'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useMinimalFilterOptional } from '@/components/MinimalFilterContext';

/**
 * Empty browse/search — one quiet line under the controls.
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

  return (
    <div className="w-full pt-2 pb-8 flex flex-col items-center text-center gap-2">
      <p className="font-sans text-[14px] font-medium text-page-muted">
        {type === 'artifact' ? tf('noArtifactMatches') : tf('noFilmMatches')}
      </p>
      {nominate ? (
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
