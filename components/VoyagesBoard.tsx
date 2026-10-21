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

function VoyagePill({ entry }: { entry: FilmLogEntry }) {
  const locale = useLocale();
  const code = formatVoyageurNumber(entry.viewer_number, locale);
  const date = formatStampDate(entry.recorded_at, locale);
  const href = entry.film_slug ? `/film/${entry.film_slug}` : undefined;

  const className =
    'flex h-16 w-full items-center gap-4 rounded-full bg-[#F5F5F7] pl-6 pr-2 text-[#0B0B0C] transition-opacity duration-200 hover:opacity-70 sm:pl-7 sm:pr-2.5';

  const body = (
    <>
      <span className="flex min-w-0 flex-1 items-baseline gap-2.5">
        <span className="truncate text-left font-sans text-[15px] font-semibold tracking-tight text-[#0B0B0C] sm:text-[16px]">
          {entry.film_name}
        </span>
        {date ? (
          <span className="shrink-0 font-sans text-[13px] font-medium text-black/40 sm:text-[14px]">
            {date}
          </span>
        ) : null}
      </span>
      <span className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-white px-4 font-interTight text-[17px] font-bold leading-none tabular-nums tracking-tight text-[#0B0B0C]">
        {code}
      </span>
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
      <h1 className="m-0 select-none font-interTight text-3xl font-bold tracking-tight text-[#0B0B0C] sm:text-4xl">
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
      <SheetEnter className="flex w-full max-w-[36rem] flex-col">
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0" aria-label={title}>
          {logs.map((entry) => (
            <li key={`${entry.film_id}-${entry.viewer_number}`}>
              <VoyagePill entry={entry} />
            </li>
          ))}
        </ul>
      </SheetEnter>
    </div>
  );
}
