'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useMinimalFilter } from '@/components/MinimalFilterContext';

/** Film / Afct switch — to the right of Cine / Mini. */
export default function ContentTypeToggle() {
  const t = useTranslations('DisplayMode');
  const { contentType, setContentType } = useMinimalFilter();

  return (
    <div className="inline-flex items-center gap-1 rounded-[8px] p-0.5 bg-white/5">
      <button
        type="button"
        onClick={() => setContentType('film')}
        className={`font-sans text-xs font-semibold px-3 py-1.5 rounded-[6px] transition-colors ${
          contentType === 'film'
            ? 'bg-white/15 text-white'
            : 'text-white/40 hover:text-white/70'
        }`}
      >
        {t('film')}
      </button>
      <button
        type="button"
        onClick={() => setContentType('artifact')}
        className={`font-sans text-xs font-semibold px-3 py-1.5 rounded-[6px] transition-colors ${
          contentType === 'artifact'
            ? 'bg-white/15 text-white'
            : 'text-white/40 hover:text-white/70'
        }`}
      >
        {t('artifact')}
      </button>
    </div>
  );
}
