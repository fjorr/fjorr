'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { Icon } from '@/components/ui/Icons';
import { useColorScheme } from '@/components/ColorSchemeProvider';
import { isColorSchemeLockedPath } from '@/lib/color-scheme';

/** Icon-only dark / light control — used in navbar menu and footer. */
export default function ColorSchemeToggle({
  activeClass,
  mutedClass,
  className = '',
}: {
  activeClass: string;
  mutedClass: string;
  className?: string;
}) {
  const t = useTranslations('Nav');
  const pathname = usePathname() || '';
  const { preference, setScheme, isLocked } = useColorScheme();
  const show = !isColorSchemeLockedPath(pathname) && !isLocked;

  if (!show) return null;

  return (
    <div
      className={`inline-flex items-center gap-0 ${className}`}
      role="group"
      aria-label={t('appearance')}
    >
      <button
        type="button"
        aria-label={t('appearanceDark')}
        aria-pressed={preference === 'dark'}
        onClick={() => setScheme('dark')}
        className={`w-5 h-6 inline-flex items-center justify-center transition-opacity ${
          preference === 'dark' ? activeClass : `${mutedClass} hover:opacity-70`
        }`}
      >
        <Icon name="moon" className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        aria-label={t('appearanceLight')}
        aria-pressed={preference === 'light'}
        onClick={() => setScheme('light')}
        className={`w-5 h-6 inline-flex items-center justify-center transition-opacity ${
          preference === 'light' ? activeClass : `${mutedClass} hover:opacity-70`
        }`}
      >
        <Icon name="bolt" className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
