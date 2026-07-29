'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

/** Plus Machine — living films doctrine + how to use. */
export default function PlusClient() {
  const t = useTranslations('Plus');

  return (
    <div className="w-full min-h-[calc(100vh-8rem)] bg-[var(--page-bg)] text-page flex flex-col items-center justify-center px-6 py-24 select-none">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Plus Machine | Fjorr',
            description: t('pageIntro'),
            url: 'https://www.fjorr.com/plus',
          }),
        }}
      />

      <div className="w-full max-w-md flex flex-col items-center text-center gap-10 sm:gap-12">
        <p className="font-futura text-[13px] sm:text-[14px] font-extrabold uppercase tracking-[0.28em] text-page">
          Fjorr
        </p>

        <h1 className="font-futura font-extrabold uppercase tracking-tighter text-[clamp(2.25rem,8vw,3.25rem)] leading-[0.9] text-page">
          {t('pageTitle')}
        </h1>

        <p className="font-sans text-[16px] sm:text-[17px] font-medium leading-relaxed tracking-tight text-page">
          {t('pageIntro')}
        </p>

        <div className="flex flex-col gap-4 font-sans text-[15px] sm:text-[16px] font-normal leading-relaxed tracking-tight text-page-muted text-left w-full">
          <p>{t('infoP1')}</p>
          <p>{t('infoP2')}</p>
          <p>{t('infoP3')}</p>
        </div>

        <div className="w-full flex flex-col gap-3 text-left pt-2">
          <p className="font-sans text-[12px] font-semibold uppercase tracking-wide text-page-faint">
            {t('howTitle')}
          </p>
          <ol className="list-none m-0 p-0 flex flex-col gap-2.5">
            <li className="font-sans text-[15px] text-page-muted leading-snug">
              <span className="font-mono text-[12px] text-page-faint mr-2">1</span>
              {t('how1')}
            </li>
            <li className="font-sans text-[15px] text-page-muted leading-snug">
              <span className="font-mono text-[12px] text-page-faint mr-2">2</span>
              {t('how2')}
            </li>
            <li className="font-sans text-[15px] text-page-muted leading-snug">
              <span className="font-mono text-[12px] text-page-faint mr-2">3</span>
              {t('how3')}
            </li>
          </ol>
        </div>

        <Link
          href="/"
          className="mt-2 inline-flex h-11 px-6 rounded-full bg-[var(--page-fg)] text-[var(--page-bg)] font-sans text-[13px] sm:text-[14px] font-bold items-center hover:opacity-90 transition-opacity"
        >
          {t('pageCta')}
        </Link>
      </div>
    </div>
  );
}
