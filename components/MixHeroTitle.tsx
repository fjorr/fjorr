'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  capitalizeLabel,
  useMinimalFilter,
} from '@/components/MinimalFilterContext';
import { useDisplayMode } from '@/components/DisplayModeProvider';

/**
 * Mix POV title above browse / search results. Hidden when mix is All.
 * Optional description subhead; search query sits under that when set.
 */
export default function MixHeroTitle({
  className = '',
  query,
}: {
  className?: string;
  /** Active search term — shown under the mix name when set. */
  query?: string;
}) {
  const tf = useTranslations('MinimalList');
  const tSearch = useTranslations('Search');
  const { mix, mixes } = useMinimalFilter();
  const { isTimeline } = useDisplayMode();

  if (mix === 'all') return null;

  const selected = mixes.find((m) => m.slug === mix);
  const rawName =
    mix === 'coming-soon' ? tf('comingSoon') : selected?.name;

  if (!rawName) return null;

  const description =
    mix === 'coming-soon' ? null : selected?.description?.trim() || null;
  const q = query?.trim() || '';

  return (
    <div className={className}>
      <h2 className="font-sans text-xl sm:text-2xl font-semibold tracking-tight text-page text-balance">
        {capitalizeLabel(rawName)}
      </h2>
      {description ? (
        <p
          className={`mt-1.5 font-sans text-sm sm:text-[15px] font-medium text-page-muted text-balance max-w-xl ${
            isTimeline ? 'mx-auto' : ''
          }`}
        >
          {description}
        </p>
      ) : null}
      {q ? (
        <p className="mt-1.5 font-mono text-sm font-medium text-page-muted truncate">
          <span className="text-page-faint">{tSearch('placeholder')}:</span>{' '}
          {q}
        </p>
      ) : null}
    </div>
  );
}
