'use client';

import React from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';

function formatStampDate(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, {
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
  {
    shell: string;
    film: string;
    honor: string;
    date: string;
    poster: string;
  }
> = {
  page: {
    shell: 'bg-[color-mix(in_srgb,var(--page-fg)_6%,transparent)]',
    film: 'text-page',
    honor: 'text-page',
    date: 'text-page-faint',
    poster: 'bg-[color-mix(in_srgb,var(--page-fg)_8%,transparent)]',
  },
  onDark: {
    shell: 'bg-white/[0.06]',
    film: 'text-white',
    honor: 'text-white',
    date: 'text-white/35',
    poster: 'bg-white/5',
  },
};

/**
 * Shared Voyageur mark — poster + three text lines:
 * 1 film title · 2 Voyageur No. (hero) · 3 date
 */
export default function VoyageurBadgeMark({
  filmName,
  filmPoster = null,
  voyageurNumber,
  recordedAt,
  tone = 'page',
  compact = false,
  className = '',
}: {
  filmName: string;
  filmPoster?: string | null;
  voyageurNumber: number;
  recordedAt?: string | null;
  tone?: Tone;
  compact?: boolean;
  className?: string;
}) {
  const t = useTranslations('Film');
  const locale = useLocale();
  const date = recordedAt ? formatStampDate(recordedAt, locale) : '';
  if (!date || !filmName.trim()) return null;

  const c = TONE[tone];
  const line = 'm-0 font-sans tabular-nums leading-none';
  // 2:3 poster ≈ three text lines (13 + 15 + 11 + gaps)
  const posterBox = compact
    ? 'relative w-8 h-12 rounded-[2px] overflow-hidden shrink-0'
    : 'relative w-[34px] h-[51px] rounded-[2px] overflow-hidden shrink-0';

  return (
    <div
      className={`inline-flex max-w-full select-none items-start gap-3 rounded-[6px] text-left ${
        compact ? 'p-3 pr-7' : 'p-4 pr-8'
      } ${c.shell} ${className}`}
    >
      <div className={`${posterBox} ${c.poster}`}>
        {filmPoster ? (
          <Image
            src={filmPoster}
            alt=""
            fill
            sizes={compact ? '32px' : '34px'}
            className="object-cover"
          />
        ) : (
          <span
            aria-hidden
            className={`absolute inset-0 flex items-center justify-center font-sans text-[11px] font-semibold ${c.date}`}
          >
            {(filmName.trim().charAt(0) || 'F').toUpperCase()}
          </span>
        )}
      </div>

      <div className="min-w-0 flex flex-col justify-between self-stretch py-px">
        <p
          className={`${line} text-[13px] font-semibold tracking-tight ${c.film} ${
            compact ? 'line-clamp-2' : 'truncate'
          }`}
        >
          {filmName}
        </p>
        <p className={`${line} text-[15px] font-bold tracking-tight ${c.honor}`}>
          {t('voyageurBadgeTitle', { number: voyageurNumber })}
        </p>
        <p className={`${line} text-[11px] font-medium ${c.date}`}>{date}</p>
      </div>
    </div>
  );
}
