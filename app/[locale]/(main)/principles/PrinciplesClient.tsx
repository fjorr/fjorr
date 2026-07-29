'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

const PRINCIPLE_KEYS = [
  { title: 'p1Title', body: 'p1Body' },
  { title: 'p2Title', body: 'p2Body' },
  { title: 'p3Title', body: 'p3Body' },
  { title: 'p4Title', body: 'p4Body' },
] as const;

export default function PrinciplesClient() {
  const t = useTranslations('Principles');

  return (
    <div className="w-full min-h-screen bg-[var(--page-bg)] text-page pb-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Principles | Fjorr',
            description: t('intro'),
            url: 'https://www.fjorr.com/principles',
          }),
        }}
      />

      <div className="w-full max-w-2xl mx-auto px-5 sm:px-8 pt-14 sm:pt-20 flex flex-col gap-4 mb-14 sm:mb-20">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-page-faint">
          {t('draftLabel')}
        </p>
        <h1 className="font-futura text-5xl sm:text-6xl md:text-7xl font-extrabold uppercase tracking-tighter text-page leading-[0.95] select-none">
          {t('title')}
        </h1>
        <p className="font-sans font-medium text-[15px] sm:text-[16px] leading-relaxed text-page-muted max-w-md tracking-tight">
          {t('intro')}
        </p>
      </div>

      <ol className="w-full max-w-2xl mx-auto px-5 sm:px-8 flex flex-col gap-10 sm:gap-12 list-none m-0 p-0">
        {PRINCIPLE_KEYS.map((item, index) => (
          <li key={item.title} className="flex flex-col gap-2 sm:gap-2.5">
            <div className="flex items-baseline gap-3 sm:gap-4">
              <span className="font-mono text-[12px] font-medium tabular-nums text-page-faint shrink-0">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h2 className="font-sans text-[18px] sm:text-[20px] font-semibold tracking-tight text-page leading-snug">
                {t(item.title)}
              </h2>
            </div>
            <p className="font-sans text-[15px] sm:text-[16px] leading-relaxed text-page-muted tracking-tight pl-[calc(1.5rem+0.75rem)] sm:pl-[calc(1.5rem+1rem)] max-w-lg">
              {t(item.body)}
            </p>
          </li>
        ))}
      </ol>

      <div className="w-full max-w-2xl mx-auto px-5 sm:px-8 mt-16 sm:mt-20 flex flex-col gap-3">
        <p className="font-sans text-[14px] text-page-faint leading-snug max-w-sm">
          {t('footerNote')}
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link
            href="/nominate"
            className="font-sans text-[14px] font-semibold text-page underline underline-offset-4 decoration-page-faint hover:opacity-70 transition-opacity"
          >
            {t('nominateLink')}
          </Link>
          <Link
            href="/bounties"
            className="font-sans text-[14px] font-semibold text-page underline underline-offset-4 decoration-page-faint hover:opacity-70 transition-opacity"
          >
            {t('bountiesLink')}
          </Link>
          <Link
            href="/about"
            className="font-sans text-[14px] font-semibold text-page underline underline-offset-4 decoration-page-faint hover:opacity-70 transition-opacity"
          >
            {t('aboutLink')}
          </Link>
        </div>
      </div>
    </div>
  );
}
