'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

const DISCIPLINE_KEYS = [
  'archivists',
  'cinematographers',
  'composers',
  'curators',
  'directors',
  'editors',
  'producers',
  'researchers',
  'soundDesigners',
  'writers',
] as const;

export default function BureauxClient() {
  const t = useTranslations('Bureaux');
  const mailto = `mailto:scout@fjorr.com?subject=${encodeURIComponent(t('emailSubject'))}`;

  return (
    <div className="w-full min-h-screen bg-[var(--page-bg)] text-page pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'The Bureaux | Fjorr',
            description: t('headline'),
            url: 'https://www.fjorr.com/bureaux',
          }),
        }}
      />

      <div className="w-full max-w-5xl mx-auto px-5 sm:px-8 pt-14 sm:pt-20">
        <header className="max-w-2xl mx-auto mb-12 sm:mb-16 text-center">
          <p className="mb-4 sm:mb-5 font-sans text-[15px] sm:text-[16px] font-semibold normal-case tracking-normal text-page select-none">
            {t('eyebrow')}
          </p>
          <h1 className="font-futura tracking-tighter text-page select-none text-4xl sm:text-5xl md:text-[4rem] leading-[1.05] text-balance">
            {t('headline')}
          </h1>
          <div className="mt-5 sm:mt-6 space-y-1 font-sans font-medium text-[15px] sm:text-[16px] leading-snug tracking-normal text-page-muted">
            <p>{t('lead')}</p>
            <p>{t('sub')}</p>
          </div>
        </header>

        <ul className="m-0 p-0 list-none flex flex-col items-center gap-2 sm:gap-2.5 text-center">
          {DISCIPLINE_KEYS.map((key) => (
            <li
              key={key}
              className="font-interTight font-bold normal-case tracking-normal text-[1.05rem] sm:text-[1.15rem] leading-[1.3] text-page"
            >
              {t(`disciplines.${key}`)}
            </li>
          ))}
        </ul>

        <footer className="mt-12 sm:mt-14 flex flex-col items-center gap-3 text-center">
          <p className="font-sans text-[14px] font-medium text-page-muted tracking-normal">
            {t('suggest')}
          </p>
          <a
            href={mailto}
            className="font-sans text-[14px] font-semibold text-page-muted hover:text-page transition-colors underline underline-offset-4 decoration-page-faint"
          >
            {t('cta')}
          </a>
        </footer>
      </div>
    </div>
  );
}
