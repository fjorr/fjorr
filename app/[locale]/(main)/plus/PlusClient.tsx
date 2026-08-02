'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

const SECTIONS = [
  { title: 'sectionWhat', paras: ['whatP1', 'whatP2'] as const },
  { title: 'sectionWho', paras: ['whoP1', 'whoP2'] as const },
  { title: 'sectionSubmit', paras: ['submitP1', 'submitP2'] as const },
  { title: 'sectionWhy', paras: ['whyP1'] as const },
] as const;

/** Plus Machine — living films doctrine. */
export default function PlusClient() {
  const t = useTranslations('Plus');

  return (
    <div className="w-full min-h-screen bg-[var(--page-bg)] text-page pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Plus Machine | Fjorr',
            description: t('pageHeadline'),
            url: 'https://www.fjorr.com/plus',
          }),
        }}
      />

      <div className="w-full max-w-4xl mx-auto px-[10%] pt-14 sm:pt-20 flex flex-col items-center text-center">
        <header className="w-full max-w-lg mb-12 sm:mb-16 flex flex-col items-center">
          <p className="font-sans text-lg sm:text-xl font-semibold normal-case tracking-normal text-page select-none">
            {t('pageEyebrow')}
          </p>
          <h1 className="mt-2 sm:mt-2.5 mb-5 sm:mb-6 font-futura tracking-tighter text-page select-none text-5xl sm:text-6xl md:text-7xl !leading-[0.9] text-center">
            {t('pageHeadline')
              .split('\n')
              .filter(Boolean)
              .map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
          </h1>
          <div
            className="font-sans font-medium text-[15px] sm:text-[16px] leading-[1.55] tracking-normal max-w-md space-y-4 text-left sm:text-center"
            style={{
              color: 'color-mix(in srgb, var(--page-fg) 78%, transparent)',
            }}
          >
            <p>{t('leadP1')}</p>
            <p>{t('leadP2')}</p>
          </div>
        </header>
      </div>

      <div className="w-full px-5 sm:px-8">
        <div className="mx-auto w-full max-w-[34rem] flex flex-col gap-10 sm:gap-12 text-left">
          {SECTIONS.map((section) => (
            <section key={section.title} className="flex flex-col gap-3 sm:gap-3.5">
              <h2 className="font-interTight font-bold normal-case tracking-normal text-[1.35rem] sm:text-[1.5rem] leading-[1.15] text-page">
                {t(section.title)}
              </h2>
              <div
                className="font-sans font-medium text-[15px] sm:text-[16px] leading-[1.55] tracking-normal space-y-3.5"
                style={{
                  color: 'color-mix(in srgb, var(--page-fg) 78%, transparent)',
                }}
              >
                {section.paras.map((key) => (
                  <p key={key}>{t(key)}</p>
                ))}
              </div>
            </section>
          ))}

          <p className="font-interTight font-bold text-[1.35rem] sm:text-[1.5rem] leading-[1.2] text-page pt-2">
            {t('closing')}
          </p>

          <div id="how" className="pt-2 flex flex-col gap-3 scroll-mt-24">
            <p className="font-sans text-[12px] font-semibold uppercase tracking-wide text-page-faint">
              {t('howTitle')}
            </p>
            <ol className="list-none m-0 p-0 flex flex-col gap-2.5">
              {(['how1', 'how2', 'how3'] as const).map((key, i) => (
                <li
                  key={key}
                  className="font-sans text-[15px] sm:text-[16px] font-medium leading-[1.55]"
                  style={{
                    color: 'color-mix(in srgb, var(--page-fg) 78%, transparent)',
                  }}
                >
                  <span className="font-mono text-[12px] text-page-faint mr-2">
                    {i + 1}
                  </span>
                  {t(key)}
                </li>
              ))}
            </ol>
          </div>

          <footer className="pt-2 flex flex-wrap gap-x-5 gap-y-2">
            <Link
              href="/"
              className="inline-flex h-11 px-6 rounded-full bg-[var(--page-fg)] text-[var(--page-bg)] font-sans text-[13px] sm:text-[14px] font-bold items-center hover:opacity-90 transition-opacity"
            >
              {t('pageCta')}
            </Link>
            <Link
              href="/cabinet"
              className="inline-flex h-11 items-center font-sans text-[14px] font-semibold text-page-muted hover:text-page transition-colors underline underline-offset-4 decoration-page-faint"
            >
              {t('pageCabinetLink')}
            </Link>
            <Link
              href="/manual/plus"
              className="inline-flex h-11 items-center font-sans text-[14px] font-semibold text-page-muted hover:text-page transition-colors underline underline-offset-4 decoration-page-faint"
            >
              Manual · Plus Machine
            </Link>
          </footer>
        </div>
      </div>
    </div>
  );
}
