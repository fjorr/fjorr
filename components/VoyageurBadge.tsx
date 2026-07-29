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
 * Voyageur No. + Member # + date — never a live counter.
 */
export default function VoyageurBadge({ stamp }: { stamp: VoyageurStamp }) {
  const t = useTranslations('Film');
  const date = formatStampDate(stamp.recordedAt);
  if (!date) return null;

  return (
    <div className="mt-6 mb-2 select-none">
      <p className="font-mono text-[13px] font-medium tracking-normal text-page tabular-nums">
        {t('voyageurBadgeTitle', { number: stamp.voyageurNumber })}
      </p>
      <p className="mt-1 font-mono text-[11px] text-page-faint tabular-nums">
        {t('voyageurBadgeMeta', {
          member: stamp.memberNumber,
          date,
        })}
      </p>
    </div>
  );
}
