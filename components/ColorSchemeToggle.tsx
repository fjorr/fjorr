'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { useColorScheme } from '@/components/ColorSchemeProvider';
import { isColorSchemeLockedPath } from '@/lib/color-scheme';

/** Dark / Light segmented switch — matches Film / Afct control-bar chips. */
export default function ColorSchemeToggle({
  className = '',
}: {
  className?: string;
}) {
  const t = useTranslations('Nav');
  const pathname = usePathname() || '';
  const { preference, setScheme, isLocked } = useColorScheme();
  const show = !isColorSchemeLockedPath(pathname) && !isLocked;

  if (!show) return null;

  return (
    <div
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-[8px] p-0.5 bg-page-chip ${className}`}
      role="group"
      aria-label={t('appearance')}
    >
      <button
        type="button"
        aria-pressed={preference === 'dark'}
        onClick={() => setScheme('dark')}
        className={`font-sans text-[11px] sm:text-xs font-semibold px-1.5 sm:px-3 py-1.5 rounded-[6px] transition-colors whitespace-nowrap ${
          preference === 'dark'
            ? 'bg-page-chip-active text-page'
            : 'text-page-faint hover:text-page-muted'
        }`}
      >
        {t('appearanceDark')}
      </button>
      <button
        type="button"
        aria-pressed={preference === 'light'}
        onClick={() => setScheme('light')}
        className={`font-sans text-[11px] sm:text-xs font-semibold px-1.5 sm:px-3 py-1.5 rounded-[6px] transition-colors whitespace-nowrap ${
          preference === 'light'
            ? 'bg-page-chip-active text-page'
            : 'text-page-faint hover:text-page-muted'
        }`}
      >
        {t('appearanceLight')}
      </button>
    </div>
  );
}
