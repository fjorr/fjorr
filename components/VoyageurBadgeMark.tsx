'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

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

type Tone = 'page' | 'onDark';

const TONE: Record<
  Tone,
  { shell: string; title: string; version: string; meta: string }
> = {
  page: {
    shell:
      'bg-[color-mix(in_srgb,var(--page-fg)_6%,transparent)] ring-1 ring-[color-mix(in_srgb,var(--page-fg)_10%,transparent)]',
    title: 'text-page',
    version: 'text-page-muted',
    meta: 'text-page-faint',
  },
  onDark: {
    shell: 'bg-white/[0.06] ring-1 ring-white/10',
    title: 'text-white',
    version: 'text-white/45',
    meta: 'text-white/35',
  },
};

/**
 * Shared Voyageur mark — same chip everywhere (film page, share modal, send sheet).
 */
export default function VoyageurBadgeMark({
  voyageurNumber,
  filmVersion,
  memberNumber,
  recordedAt,
  tone = 'page',
  className = '',
}: {
  voyageurNumber: number;
  filmVersion: number;
  memberNumber?: number | null;
  recordedAt?: string | null;
  tone?: Tone;
  className?: string;
}) {
  const t = useTranslations('Film');
  const date = recordedAt ? formatStampDate(recordedAt) : '';
  if (!date) return null;

  const c = TONE[tone];

  // Shared line box so baseline rhythm stays even across different type sizes.
  const line =
    'm-0 font-sans tabular-nums leading-[18px]';

  return (
    <div
      className={`inline-flex max-w-full select-none flex-col rounded-[8px] pl-3.5 pr-5 py-3 text-left ${c.shell} ${className}`}
    >
      <p className={`${line} text-[14px] font-bold tracking-tight ${c.title}`}>
        {t('voyageurBadgeTitle', { number: voyageurNumber })}
      </p>
      <p className={`${line} text-[12px] font-medium ${c.version}`}>
        {t('voyageurBadgeVersion', { version: filmVersion, date })}
      </p>
      {memberNumber ? (
        <p className={`${line} text-[11px] ${c.meta}`}>
          {t('voyageurBadgeMeta', { member: memberNumber })}
        </p>
      ) : null}
    </div>
  );
}
