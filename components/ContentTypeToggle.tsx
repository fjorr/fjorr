'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useMinimalFilter } from '@/components/MinimalFilterContext';

/** Film / Afct switch — to the right of Cine / Mini / Time. */
export default function ContentTypeToggle() {
  const t = useTranslations('DisplayMode');
  const { contentType, setContentType } = useMinimalFilter();

  return (
    <div className="inline-flex shrink-0 items-center gap-0.5 rounded-[8px] p-0.5 bg-page-chip">
      <button
        type="button"
        onClick={() => setContentType('film')}
        className={`font-sans text-[11px] sm:text-xs font-semibold px-2 sm:px-3 py-1.5 rounded-[6px] transition-colors whitespace-nowrap ${
          contentType === 'film'
            ? 'bg-page-chip-active text-page'
            : 'text-page-faint hover:text-page-muted'
        }`}
      >
        {t('film')}
      </button>
      <button
        type="button"
        onClick={() => setContentType('artifact')}
        className={`font-sans text-[11px] sm:text-xs font-semibold px-2 sm:px-3 py-1.5 rounded-[6px] transition-colors whitespace-nowrap ${
          contentType === 'artifact'
            ? 'bg-page-chip-active text-page'
            : 'text-page-faint hover:text-page-muted'
        }`}
      >
        {t('artifact')}
      </button>
    </div>
  );
}
