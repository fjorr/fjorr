'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

const PRINCIPLES = [
  { title: 'p1Title', body: 'p1Body', numeral: 'I' },
  { title: 'p2Title', body: 'p2Body', numeral: 'II' },
  { title: 'p3Title', body: 'p3Body', numeral: 'III' },
  { title: 'p4Title', body: 'p4Body', numeral: 'IV' },
  { title: 'p5Title', body: 'p5Body', numeral: 'V' },
  { title: 'p6Title', body: 'p6Body', numeral: 'VI' },
] as const;

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

      <div className="w-full max-w-4xl mx-auto px-[10%] pt-14 sm:pt-20 flex flex-col items-center text-center">
        <header className="w-full max-w-lg mb-12 sm:mb-16 flex flex-col items-center">
          <h1 className="mb-5 sm:mb-6 font-futura tracking-tighter text-page select-none text-5xl sm:text-6xl md:text-7xl !leading-[0.9] text-center">
            {t('title')
              .split('\n')
              .filter(Boolean)
              .map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
          </h1>
          <p className="font-sans font-medium text-[15px] sm:text-[16px] leading-[1.55] tracking-normal text-page max-w-md">
            {t('intro')}
          </p>
        </header>
      </div>

      <div className="w-full px-5 sm:px-8">
        <ul className="mx-auto w-full max-w-[22rem] sm:max-w-[27rem] m-0 p-0 list-none flex flex-col gap-10 sm:gap-14">
          {PRINCIPLES.map((item) => (
            <li
              key={item.title}
              className="grid grid-cols-1 sm:grid-cols-[6rem_minmax(0,19rem)] gap-x-8 gap-y-3 items-start text-left"
            >
              <span
                className="font-futura select-none text-[clamp(4.5rem,14vw,6.5rem)] tracking-tighter !leading-[0.85] text-page"
                aria-hidden
              >
                {item.numeral}.
              </span>

              <div className="min-w-0 max-w-[19rem] sm:pt-2">
                <h2 className="font-interTight font-bold normal-case tracking-normal text-[1.7rem] sm:text-[1.8rem] md:text-[1.9rem] leading-[1.15] text-page text-balance">
                  {t(item.title)}
                </h2>
                <p className="mt-2.5 sm:mt-3 font-sans font-medium text-[15px] sm:text-[16px] leading-[1.55] tracking-normal text-page-muted">
                  {t(item.body)}
                </p>
              </div>
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
