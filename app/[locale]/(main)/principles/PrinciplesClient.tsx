'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

const PRINCIPLE_KEYS = [
  { title: 'p1Title', body: 'p1Body' },
  { title: 'p2Title', body: 'p2Body' },
  { title: 'p3Title', body: 'p3Body' },
  { title: 'p4Title', body: 'p4Body' },
  { title: 'p5Title', body: 'p5Body' },
  { title: 'p6Title', body: 'p6Body' },
] as const;

const HAIRLINE = 'color-mix(in srgb, var(--page-fg) 10%, transparent)';
const INDEX = 'color-mix(in srgb, var(--page-fg) 35%, transparent)';

export default function PrinciplesClient() {
  const t = useTranslations('Principles');

  return (
    <div className="w-full min-h-screen bg-[var(--page-bg)] text-page pb-24">
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

      <div className="w-full max-w-5xl mx-auto px-5 sm:px-8 pt-14 sm:pt-20">
        <header className="max-w-lg mx-auto mb-12 sm:mb-16 text-center flex flex-col items-center">
          <h1 className="font-futura tracking-tighter text-page select-none text-5xl sm:text-6xl md:text-7xl !leading-[0.9] max-w-[11ch]">
            {t('title')}
          </h1>
          <p className="mt-5 sm:mt-6 font-sans font-medium text-[15px] sm:text-[16px] leading-snug tracking-normal text-page">
            {t('intro')}
          </p>
        </header>

        <ul className="m-0 p-0 list-none border-t" style={{ borderColor: HAIRLINE }}>
          {PRINCIPLE_KEYS.map((item, index) => (
            <li
              key={item.title}
              className="grid grid-cols-[2.5rem_minmax(0,1fr)] md:grid-cols-[3rem_minmax(0,1.1fr)_minmax(0,1fr)] gap-x-4 sm:gap-x-6 md:gap-x-8 py-6 sm:py-7 border-b items-baseline"
              style={{ borderColor: HAIRLINE }}
            >
              <span
                className="font-mono text-[12px] sm:text-[13px] font-medium tabular-nums tracking-wide select-none"
                style={{ color: INDEX }}
                aria-hidden
              >
                {String(index + 1).padStart(2, '0')}
              </span>

              <h2 className="font-interTight font-bold normal-case tracking-normal text-[1.05rem] sm:text-[1.15rem] leading-[1.3] text-page text-balance">
                {t(item.title)}
              </h2>

              <p className="col-start-2 md:col-start-3 font-sans font-medium text-[13px] sm:text-[14px] leading-[1.5] tracking-normal text-page-muted mt-2 md:mt-0 max-w-[45ch]">
                {t(item.body)}
              </p>
            </li>
          ))}
        </ul>

        <footer className="mt-12 sm:mt-14 flex flex-wrap justify-center gap-x-5 gap-y-2">
          <Link
            href="/nominate"
            className="font-sans text-[14px] font-semibold text-page-muted hover:text-page transition-colors underline underline-offset-4 decoration-page-faint"
          >
            {t('nominateLink')}
          </Link>
          <Link
            href="/bounties"
            className="font-sans text-[14px] font-semibold text-page-muted hover:text-page transition-colors underline underline-offset-4 decoration-page-faint"
          >
            {t('bountiesLink')}
          </Link>
          <Link
            href="/about"
            className="font-sans text-[14px] font-semibold text-page-muted hover:text-page transition-colors underline underline-offset-4 decoration-page-faint"
          >
            {t('aboutLink')}
          </Link>
        </footer>
      </div>
    </div>
  );
}
