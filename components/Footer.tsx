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

interface FooterProps {
  variant?: 'light' | 'dark';
}

export default function Footer({ variant }: FooterProps) {
  const t = useTranslations('Footer');
  const tNav = useTranslations('Nav');
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale() as AppLocale;
  const isAboutPage = pathname === '/about';
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const isCustomVariant = variant === 'light' || variant === 'dark';
  const isDarkBg = variant === 'light' || isAboutPage;

  const textColor = (isCustomVariant || isAboutPage)
    ? (isDarkBg ? 'text-white' : 'text-black')
    : 'text-black dark:text-white';

  const subTextColor = (isCustomVariant || isAboutPage)
    ? (isDarkBg ? 'text-white/60' : 'text-black/60')
    : 'text-black/40 dark:text-white/60';

  const mutedTextColor = (isCustomVariant || isAboutPage)
    ? (isDarkBg ? 'text-white/40' : 'text-black/40')
    : 'text-black/30 dark:text-white/40';

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
        w-full pt-16 pb-10 px-[10%] text-center flex flex-col items-center transition-colors duration-300
        ${getBackgroundClass()}
        ${textColor}
      `}
    >
      <div ref={langRef} className="relative mb-4 flex flex-col items-center">
        <button
          type="button"
          aria-label={tNav('language')}
          aria-expanded={langOpen}
          aria-haspopup="listbox"
          onClick={() => setLangOpen((open) => !open)}
          className={`inline-flex items-center gap-1.5 font-sans text-[14px] font-semibold transition-colors hover:opacity-80 ${subTextColor}`}
        >
          <Icon name="globe" className="w-3.5 h-3.5" />
          <span>
            {localeLabels[locale]}{' '}
            <span className={mutedTextColor}>({locale})</span>
          </span>
        </button>

        {langOpen && (
          <div
            role="listbox"
            aria-label={tNav('languages')}
            className={`absolute bottom-full mb-2 z-20 min-w-[10rem] rounded-[10px] border py-1.5 text-left shadow-[0_12px_32px_rgba(0,0,0,0.35)] ${
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

      <div className="w-full max-w-64 mb-6">
        <IntelForm
          variant={isAboutPage ? 'light' : variant}
          isCustomVariant={isCustomVariant || isAboutPage}
        />
      </div>

      <div className="max-w-2xl mb-2">
        <p className={`font-sans font-normal text-[12px] leading-[1.4em] tracking-normal transition-colors ${subTextColor}`}>
          {t('blurb')}
        </p>
      </div>

      <div className={`flex flex-col sm:flex-row items-center justify-center gap-2 mb-0 font-sans text-[12px] transition-colors ${subTextColor}`}>
        <div className={`flex items-center gap-1 transition-colors ${mutedTextColor}`}>
          <Icon name="lock" className="w-4 h-4" />
          <Icon name="cc" className="w-4 h-4" />
          <Icon name="globe" className="w-4 h-4" />
        </div>

        <div className="flex items-center gap-2">
          <Link href="/privacy" className={`hover:opacity-80 transition-colors ${subTextColor}`}>
            {t('privacy')}
          </Link>
          <Link href="/terms" className={`hover:opacity-80 transition-colors ${subTextColor}`}>
            {t('terms')}
          </Link>
        </div>
      </div>

      <div className="w-full pt-2">
        <p className={`font-sans text-[11px] tracking-wide transition-colors ${mutedTextColor}`}>
          {t('copyright')}
        </p>
      </div>
    </footer>
  );
}
