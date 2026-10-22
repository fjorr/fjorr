'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { localeLabels, locales, type AppLocale } from '@/i18n/config';
import SheetEnter from '@/components/house/SheetEnter';

function localeCode(code: AppLocale) {
  return code.toUpperCase();
}

/**
 * Language sheet. The pill states the current language. The text below
 * is only the other languages — choosing one confirms it.
 */
export default function LanguagePanel({
  onConfirm,
}: {
  onConfirm: (code: AppLocale) => void;
}) {
  const t = useTranslations('Nav');
  const locale = useLocale() as AppLocale;
  const others = locales.filter((code) => code !== locale);

  return (
    <div
      role="dialog"
      aria-label={t('languages')}
      className="absolute inset-0 z-50 flex flex-col bg-white text-[#0B0B0C]"
    >
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6">
        <SheetEnter className="flex w-full max-w-[36rem] flex-col items-center">
          <h1 className="m-0 mb-8 text-center text-balance font-[family-name:var(--font-circular-black)] text-[clamp(2.25rem,5.5vw,3rem)] font-[900] leading-[1.05] tracking-[-0.045em] text-[#0B0B0C]">
            {t('languagesHeadline')}
          </h1>
          <p className="m-0 inline-flex h-12 items-center gap-3.5 rounded-full bg-[#F5F5F7] pl-6 pr-5">
            <span className="font-sans text-[15px] font-semibold tracking-tight text-[#0B0B0C]">
              {localeLabels[locale]}
            </span>
            <span className="font-sans text-[13px] font-medium tracking-[0.08em] text-black/35">
              {localeCode(locale)}
            </span>
          </p>

          <ul className="m-0 mt-8 flex w-full max-w-[18rem] list-none flex-col items-center gap-1 p-0 md:max-w-[26rem] md:flex-row md:flex-wrap md:justify-center md:gap-x-5 md:gap-y-3">
            {others.map((code) => (
              <li key={code}>
                <button
                  type="button"
                  onClick={() => onConfirm(code)}
                  className="bg-transparent px-2 py-2 font-sans text-[15px] font-medium tracking-tight text-black/45 transition-colors hover:text-[#0B0B0C] md:px-0 md:py-0"
                >
                  {localeLabels[code]}
                </button>
              </li>
            ))}
          </ul>
        </SheetEnter>
      </div>
    </div>
  );
}
