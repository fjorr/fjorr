"use client";

import React from 'react';
import { Icon } from './ui/Icons';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { IntelForm } from './IntelForm';
import { usePathname } from 'next/navigation';

interface FooterProps {
  variant?: 'light' | 'dark';
}

export default function Footer({ variant }: FooterProps) {
  const t = useTranslations('Footer');
  const pathname = usePathname();
  const isAboutPage = pathname === '/about';

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

  return (
    <footer
      className={`
        w-full pt-16 pb-10 px-[10%] text-center flex flex-col items-center transition-colors duration-300
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
