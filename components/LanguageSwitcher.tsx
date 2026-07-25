'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  LOCALE_COOKIE,
  localeLabels,
  locales,
  type AppLocale,
} from '@/i18n/config';

/** Compact inline language chips (legacy). Prefer the navbar language panel. */
export default function LanguageSwitcher({
  variant = 'light',
}: {
  variant?: 'light' | 'dark';
}) {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const muted = variant === 'light' ? 'text-white/40' : 'text-black/40';
  const active = variant === 'light' ? 'text-white' : 'text-black';
  const hover = variant === 'light' ? 'hover:text-white/80' : 'hover:text-black/80';

  const setLocale = (next: AppLocale) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  };

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1" role="group" aria-label="Language">
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
