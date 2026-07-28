'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Icon } from './ui/Icons';
import { useLocale, useTranslations } from 'next-intl';
import { IntelForm } from './IntelForm';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import {
  localeLabels,
  locales,
  stripLocalePrefix,
  type AppLocale,
} from '@/i18n/config';
import { useColorScheme } from '@/components/ColorSchemeProvider';
import { isColorSchemeLockedPath } from '@/lib/color-scheme';
import ColorSchemeToggle from '@/components/ColorSchemeToggle';

interface FooterProps {
  variant?: 'light' | 'dark';
}

export default function Footer({ variant }: FooterProps) {
  const t = useTranslations('Footer');
  const tNav = useTranslations('Nav');
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale() as AppLocale;
  const { isLocked } = useColorScheme();
  const isAboutPage = pathname === '/about';
  const showAppearance = !isColorSchemeLockedPath(pathname) && !isLocked;
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const isCustomVariant = variant === 'light' || variant === 'dark';
  const isDarkBg = variant === 'light' || isAboutPage;

  const textColor =
    isCustomVariant || isAboutPage
      ? isDarkBg
        ? 'text-white'
        : 'text-black'
      : 'text-black dark:text-white';

  const subTextColor =
    isCustomVariant || isAboutPage
      ? isDarkBg
        ? 'text-white/60'
        : 'text-black/60'
      : 'text-black/40 dark:text-white/60';

  const mutedTextColor =
    isCustomVariant || isAboutPage
      ? isDarkBg
        ? 'text-white/40'
        : 'text-black/40'
      : 'text-black/30 dark:text-white/40';

  const faintTextColor =
    isCustomVariant || isAboutPage
      ? isDarkBg
        ? 'text-white/25'
        : 'text-black/25'
      : 'text-black/25 dark:text-white/25';

  const getBackgroundClass = () => {
    if (isAboutPage) return 'bg-black';
    if (isCustomVariant) return 'bg-transparent';
    return 'bg-[#F5F5F7] dark:bg-[#1F1F1F]';
  };

  const setLocale = (next: AppLocale) => {
    if (next === locale) {
      setLangOpen(false);
      return;
    }
    const raw =
      typeof window !== 'undefined' ? window.location.pathname : pathname;
    const href = stripLocalePrefix(raw || '/') || '/';
    setLangOpen(false);
    router.replace(href, { locale: next });
  };

  useEffect(() => {
    if (!langOpen) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!langRef.current?.contains(event.target as Node)) {
        setLangOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLangOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [langOpen]);

  return (
    <footer
      className={`
        w-full pt-14 pb-8 px-[10%] text-center flex flex-col items-center transition-colors duration-300
        ${getBackgroundClass()}
        ${textColor}
      `}
    >
      <div className="w-full max-w-64 mb-6">
        <IntelForm
          variant={isAboutPage ? 'light' : variant}
          isCustomVariant={isCustomVariant || isAboutPage}
        />
      </div>

      <div className="relative mb-6 flex items-center justify-center gap-3">
        <div ref={langRef} className="relative flex flex-col items-center">
          <button
            type="button"
            aria-label={tNav('language')}
            aria-expanded={langOpen}
            aria-haspopup="listbox"
            onClick={() => setLangOpen((open) => !open)}
            className={`inline-flex items-center gap-1.5 transition-colors hover:opacity-80 ${subTextColor}`}
          >
            <Icon name="globe" className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.05em] leading-none">
              {locale}
            </span>
          </button>

          {langOpen && (
            <div
              role="listbox"
              aria-label={tNav('languages')}
              className={`absolute bottom-full mb-2 z-20 min-w-[10rem] rounded-[10px] border py-1.5 text-left menu-surface shadow-[0_12px_32px_rgba(0,0,0,0.35)] ${
                isDarkBg
                  ? 'border-white/10 bg-[#1F1F1F]'
                  : 'border-black/10 bg-white'
              }`}
            >
              {locales.map((code) => (
                <button
                  key={code}
                  type="button"
                  role="option"
                  aria-selected={locale === code}
                  onClick={() => setLocale(code)}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-1.5 font-sans text-[14px] font-semibold transition-colors ${
                    locale === code
                      ? mutedTextColor
                      : `${textColor} hover:opacity-70`
                  } ${isDarkBg ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
                >
                  <span>{localeLabels[code]}</span>
                  <span className={mutedTextColor}>{code}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {showAppearance && <ColorSchemeToggle />}
      </div>

      <div className="max-w-[16rem] mb-2">
        <p
          className={`font-sans font-normal text-[12px] leading-[1.45] tracking-normal transition-colors ${subTextColor}`}
        >
          {t('blurb')}
        </p>
      </div>

      <div
        className={`flex items-center justify-center gap-2 font-sans text-[12px] transition-colors ${subTextColor}`}
      >
        <Link
          href="/privacy"
          className={`hover:opacity-80 transition-colors ${subTextColor}`}
        >
          {t('privacy')}
        </Link>
        <span className={mutedTextColor} aria-hidden>
          ·
        </span>
        <Link
          href="/terms"
          className={`hover:opacity-80 transition-colors ${subTextColor}`}
        >
          {t('terms')}
        </Link>
      </div>

      <div className="w-full mt-4">
        <p
          className={`font-sans text-[10px] tracking-wide transition-colors ${faintTextColor}`}
        >
          {t('copyright')}
        </p>
      </div>
    </footer>
  );
}
