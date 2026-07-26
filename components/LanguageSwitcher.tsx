'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  localeLabels,
  locales,
  stripLocalePrefix,
  type AppLocale,
} from '@/i18n/config';
import { usePathname, useRouter } from '@/i18n/navigation';

/** Compact inline language chips (legacy). Prefer the navbar language panel. */
export default function LanguageSwitcher({
  variant = 'light',
}: {
  variant?: 'light' | 'dark';
}) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations('Nav');
  const router = useRouter();
  const pathname = usePathname();
  const muted = variant === 'light' ? 'text-white/40' : 'text-black/40';
  const active = variant === 'light' ? 'text-white' : 'text-black';
  const hover = variant === 'light' ? 'hover:text-white/80' : 'hover:text-black/80';

  const setLocale = (next: AppLocale) => {
    if (next === locale) return;
    const raw =
      typeof window !== 'undefined' ? window.location.pathname : pathname;
    const href = stripLocalePrefix(raw || '/') || '/';
    router.replace(href, { locale: next });
  };

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1" role="group" aria-label={t('language')}>
      {locales.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={`font-sans text-[12px] font-semibold tracking-wide transition-colors ${
            locale === code ? active : `${muted} ${hover}`
          }`}
        >
          {localeLabels[code]}
        </button>
      ))}
    </div>
  );
}
