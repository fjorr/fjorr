'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import type { VoyageurStamp } from '@/lib/film-record-actions';

function formatStampDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

/**
 * Rams-quiet honor mark on the film page.
 * Voyageur No. + cut watched + Member # + date — never a live counter.
 */
export default function VoyageurBadge({ stamp }: { stamp: VoyageurStamp }) {
  const t = useTranslations('Film');
  const date = formatStampDate(stamp.recordedAt);
  if (!date) return null;

  return (
    <div className="mt-6 mb-2 select-none">
      <p className="font-sans text-[13px] font-medium tracking-normal text-page">
        {t('voyageurBadgeTitle', { number: stamp.voyageurNumber })}
        <span className="text-page-muted">
          {' — '}
          {t('voyageurBadgeVersion', { version: stamp.filmVersion })}
        </span>
      </p>
      <p className="mt-1 font-sans text-[11px] text-page-faint">
        {t('voyageurBadgeMeta', {
          member: stamp.memberNumber,
          date,
        })}
      </p>
    </div>
  );
}
