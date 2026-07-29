'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ContactPill } from '@/components/ui/contact-pill';

const DISCIPLINE_KEYS = [
  'archivists',
  'cinematographers',
  'composers',
  'directors',
  'editors',
  'soundDesigners',
  'writers',
] as const;

/** LoveFrom-shaped manifesto — no names yet, just the Bureaux. */
export default function BureauxClient() {
  const t = useTranslations('Bureaux');

  return (
    <div className="w-full min-h-[calc(100vh-8rem)] bg-[var(--page-bg)] text-page flex flex-col items-center justify-center px-6 py-24 select-none">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'The Bureaux | Fjorr',
            description: t('intro'),
            url: 'https://www.fjorr.com/bureaux',
          }),
        }}
      />

      <div className="w-full max-w-md flex flex-col items-center text-center gap-10 sm:gap-12">
        <p className="font-futura text-[13px] sm:text-[14px] font-extrabold uppercase tracking-[0.28em] text-page">
          Fjorr
        </p>

        <p className="font-sans text-[16px] sm:text-[17px] font-medium leading-relaxed tracking-tight text-page">
          {t('intro')}
        </p>

        <ul className="list-none m-0 p-0 flex flex-col gap-1.5 sm:gap-2">
          {DISCIPLINE_KEYS.map((key) => (
            <li
              key={key}
              className="font-sans text-[15px] sm:text-[16px] font-normal lowercase tracking-tight text-page-muted"
            >
              {t(`disciplines.${key}`)}
            </li>
          ))}
        </ul>

        <p className="font-sans text-[15px] sm:text-[16px] font-medium leading-relaxed tracking-tight text-page max-w-xs">
          {t('closing')}
        </p>

        <div className="flex flex-col items-center gap-4 pt-2">
          <p className="font-sans text-[13px] text-page-faint tracking-tight">
            {t('suggest')}
          </p>
          <ContactPill email="scout@fjorr.com" label={t('cta')} />
        </div>
      </div>
    </div>
  );
}
