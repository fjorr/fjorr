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
        <Link
          href="/"
          className={`inline-flex shrink-0 items-center justify-center w-3.5 h-3.5 transition-opacity hover:opacity-70 ${subTextColor}`}
          aria-label="Fjorr home"
        >
          <svg
            viewBox="0 0 146 146"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            aria-hidden
          >
            <path
              d="M124.53 103.73V113.76H105.63C103.42 113.76 101.63 111.97 101.63 109.76V60.37C101.63 58.16 103.42 56.37 105.63 56.37H136.2L136.14 103.72C136.14 103.72 124.37 103.74 124.54 103.74L124.53 103.73Z"
              fill="currentColor"
            />
            <path
              d="M141.18 44.49C143.61 44.49 145.59 42.52 145.59 40.08V4.63C145.59 2.07 143.52 0 140.96 0H45.12C20.2 0 0 20.2 0 45.12V140.96C0 143.52 2.07 145.59 4.63 145.59H140.95C143.51 145.59 145.58 143.52 145.58 140.96V130.15C145.58 127.66 143.56 125.64 141.07 125.64H105.62C96.85 125.64 89.74 118.53 89.74 109.76V60.37C89.74 51.6 96.85 44.49 105.62 44.49H141.18Z"
              fill="currentColor"
            />
          </svg>
        </Link>

        <div ref={langRef} className="relative flex flex-col items-center">
          <button
            type="button"
            aria-label={tNav('language')}
            aria-expanded={langOpen}
            aria-haspopup="listbox"
            onClick={() => setLangOpen((open) => !open)}
            className={`inline-flex items-center gap-2 transition-opacity hover:opacity-70 ${textColor}`}
          >
            <Icon name="globe" className="w-[18px] h-[18px]" />
            <span className="font-sans text-[15px] font-semibold tracking-tight leading-none">
              {localeLabels[locale]}{' '}
              <span className="font-mono text-[13px] font-medium uppercase tracking-[0.04em] opacity-60">
                ({locale})
              </span>
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
          className={`font-sans font-semibold text-[12px] leading-[1.45] tracking-normal transition-colors ${subTextColor}`}
        >
          {t('blurb')}
        </p>
      </div>

      <div
        className={`flex items-center justify-center gap-2 font-sans text-[12px] transition-colors ${subTextColor}`}
      >
        <Link
          href="/manual"
          className={`hover:opacity-80 transition-colors ${subTextColor}`}
        >
          {t('help')}
        </Link>
        <span className={mutedTextColor} aria-hidden>
          ·
        </span>
        <Link
          href="/partner"
          className={`hover:opacity-80 transition-colors ${subTextColor}`}
        >
          {t('partner')}
        </Link>
        <span className={mutedTextColor} aria-hidden>
          ·
        </span>
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
