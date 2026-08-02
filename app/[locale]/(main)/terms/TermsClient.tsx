'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

export default function TermsClient() {
  const t = useTranslations('Terms');
  return (
    <div className="w-full min-h-screen bg-[var(--page-bg)] text-page pt-16 pb-24 px-[10%] text-left flex flex-col items-center">
      <div className="w-full max-w-lg flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebPage',
              name: 'Fjorr Terms Sheet',
              description:
                'How you’re welcome to use Fjorr — watching, membership, submissions, and the work.',
              dateModified: '2026-08-01',
            }),
          }}
        />

        <div className="w-full text-center mb-4 select-none animate-in fade-in zoom-in-95 duration-500 fill-mode-both">
          <h1 className="font-futura text-[48px]/[44px] md:text-[72px]/[62px] uppercase tracking-tight font-black text-page">
            {t('titleLine1')} {t('titleLine2')}
          </h1>
        </div>

        <div className="w-full flex flex-col animate-in fade-in slide-in-from-bottom-3 duration-700 delay-300 fill-mode-both">
          <div className="w-full text-center flex flex-col gap-1.5 mb-16 font-mono font-bold text-xs tracking-relaxed text-page-faint uppercase">
            <span>{t('lastUpdated')}</span>
            <span>{t('date')}</span>
          </div>

          <div className="flex flex-col gap-10">
            {(
              [
                's1',
                's2',
                's3',
                's4',
                's5',
                's6',
                's7',
                's8',
                's9',
                's10',
              ] as const
            ).map((id) => (
              <section key={id} className="flex flex-col gap-2">
                <h2 className="font-sans text-lg font-bold text-page">
                  {t(`${id}Title`)}
                </h2>
                <p className="font-sans text-[15px] leading-normal text-page-muted">
                  {t(`${id}Body`)}
                </p>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
