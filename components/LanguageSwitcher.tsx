'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { LOCALE_COOKIE, locales, type AppLocale } from '@/i18n/config';

const LABELS: Record<AppLocale, string> = {
  en: 'EN',
  fr: 'FR',
  es: 'ES',
  it: 'IT',
};

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
    <div className="flex items-center gap-2" role="group" aria-label="Language">
      {locales.map((code, index) => (
        <React.Fragment key={code}>
          {index > 0 && <span className={`${muted} text-[11px]`}>│</span>}
          <button
            type="button"
            onClick={() => setLocale(code)}
            className={`font-sans text-[11px] font-semibold tracking-wide transition-colors ${
              locale === code ? active : `${muted} ${hover}`
            }`}
          >
            {LABELS[code]}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
