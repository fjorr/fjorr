'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import SheetEnter from '@/components/house/SheetEnter';
import type { FilmLogEntry } from '@/lib/film-record-actions';

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

function formatVoyageurNumber(n: number, locale: string) {
  try {
    return new Intl.NumberFormat(locale).format(n);
  } catch {
    return String(n);
  }
}

function VoyagePoster({ entry }: { entry: FilmLogEntry }) {
  const locale = useLocale();
  const code = formatVoyageurNumber(entry.viewer_number, locale);
  const date = formatStampDate(entry.recorded_at, locale);
  const href = entry.film_slug ? `/film/${entry.film_slug}` : undefined;

  const className =
    'relative z-0 flex h-full flex-col overflow-hidden rounded-[18px] bg-white text-left text-[#0B0B0C] shadow-[3px_5px_30px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:z-10 hover:scale-[1.03] motion-reduce:transition-none motion-reduce:hover:scale-100';

  const body = (
    <>
      <div className="flex flex-col gap-1 px-3.5 pt-3.5 pb-3">
        <p className="m-0 font-interTight text-[26px] font-bold leading-none tabular-nums tracking-tight">
          {code}
        </p>
        <p className="m-0 line-clamp-2 min-h-[2.75em] font-sans text-[15px] font-semibold leading-snug tracking-tight">
          {entry.film_name}
        </p>
        <p className="m-0 font-sans text-[12px] font-medium text-black/40">
          {date || '\u00a0'}
        </p>
      </div>
      <div
        className={`relative mt-auto aspect-square w-full ${
          entry.voyage_poster ? 'bg-white' : 'bg-[#F5F5F7]'
        }`}
      >
        {entry.voyage_poster ? (
          <img
            src={entry.voyage_poster}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-bottom"
          />
        ) : null}
      </div>
    </>
  );

  if (!href) {
    return <div className={className}>{body}</div>;
  }

  return (
    <Link href={href} className={className}>
      {body}
    </Link>
  );
}

export default function VoyagesBoard({
  logs,
  title,
  emptyCtaLabel,
}: {
  logs: FilmLogEntry[];
  title: string;
  emptyCtaLabel: string;
}) {
  const t = useTranslations('Account');

  const pageHeader = (
    <header className="flex w-full flex-col items-center gap-3 text-center">
      <h1 className="m-0 select-none font-[family-name:var(--font-circular-black)] text-3xl font-[900] leading-[1.05] tracking-[-0.03em] text-[#0B0B0C] sm:text-4xl">
        {title}
      </h1>
      <p className="m-0 max-w-[28rem] font-sans text-[16px] font-medium leading-relaxed text-black/45">
        {t('voyagesLead')}
      </p>
    </header>
  );

  if (logs.length === 0) {
    return (
      <div className="flex w-full flex-col items-center gap-10">
        {pageHeader}
        <div className="flex flex-col items-center gap-6 py-6 text-center">
          <p className="m-0 max-w-[28ch] font-sans text-[16px] font-medium leading-relaxed text-black/45">
            {t('filmLogsEmpty')}
          </p>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-full bg-[#0B0B0C] px-5 font-sans text-[14px] font-semibold text-white transition-opacity hover:opacity-85"
          >
            {emptyCtaLabel}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-8">
      {pageHeader}
      <SheetEnter className="w-full">
        <ul
          className="m-0 grid w-full list-none grid-cols-2 gap-3 p-0 md:grid-cols-4 md:gap-4 xl:grid-cols-6"
          aria-label={title}
        >
          {logs.map((entry) => (
            <li key={`${entry.film_id}-${entry.viewer_number}`} className="relative hover:z-10">
              <VoyagePoster entry={entry} />
            </li>
          ))}
        </ul>
      </SheetEnter>
    </div>
  );
}
