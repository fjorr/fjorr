'use client';

import React, { type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { localeLabels, type AppLocale } from '@/i18n/config';
import { Icon } from '@/components/ui/Icons';

type Props = {
  left?: ReactNode;
  /** Poster dots — joins the centered utility cluster when present. */
  center?: ReactNode;
  langOpen?: boolean;
  intelOpen?: boolean;
  shortcutsOpen?: boolean;
  legalOpen?: boolean;
  onLanguage?: () => void;
  onIntel?: () => void;
  onShortcuts?: () => void;
  onLegal?: () => void;
  /** Loading shell: muted chrome, no click. */
  staticLanguage?: boolean;
  /**
   * Same as Navbar: `light` = white type on dark surfaces,
   * `dark` = black type on light surfaces (house default).
   */
  variant?: 'light' | 'dark';
};

/** Shared house footer: centered utilities (+ optional left/center slots). */
export default function HouseFooter({
  left,
  center,
  langOpen = false,
  intelOpen = false,
  shortcutsOpen = false,
  legalOpen = false,
  onLanguage,
  onIntel,
  onShortcuts,
  onLegal,
  staticLanguage = false,
  variant = 'dark',
}: Props) {
  const tNav = useTranslations('Nav');
  const tFilm = useTranslations('Film');
  const tFooter = useTranslations('Footer');
  const locale = useLocale() as AppLocale;
  const label = localeLabels[locale];
  const onDark = variant === 'light';

  const idleText = onDark
    ? 'text-white/40 hover:text-white/70'
    : 'text-black/40 hover:text-black/70';
  const activeText = onDark ? 'text-white' : 'text-[#0B0B0C]';
  const mutedStatic = onDark ? 'text-white/30' : 'text-black/30';
  const iconIdle = onDark
    ? 'text-white/30 hover:text-white/60'
    : 'text-black/30 hover:text-black/60';
  const iconActive = onDark ? 'text-white' : 'text-black';
  const iconStatic = onDark ? 'text-white/20' : 'text-black/20';

  const textLinkClass = `inline-flex shrink-0 items-center bg-transparent p-0 font-sans text-[14px] font-medium leading-tight tracking-normal transition-colors ${idleText}`;

  const languageClass = `inline-flex shrink-0 items-center bg-transparent p-0 font-sans text-[14px] font-medium leading-tight tracking-normal transition-colors ${
    langOpen ? activeText : idleText
  }`;

  const iconBtn = (active: boolean) =>
    `flex h-6 w-6 items-center justify-center transition-colors ${
      active ? iconActive : iconIdle
    }`;

  const languageLabel = (
    <span className="whitespace-nowrap leading-tight">{label}</span>
  );

  const utilities = (
    <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
      {staticLanguage ? (
        <span
          className={`inline-flex shrink-0 items-center whitespace-nowrap font-sans text-[14px] font-medium leading-tight ${mutedStatic}`}
          aria-hidden
        >
          {languageLabel}
        </span>
      ) : onLanguage ? (
        <button
          type="button"
          aria-label={tNav('language')}
          aria-expanded={langOpen}
          onClick={onLanguage}
          className={languageClass}
        >
          {languageLabel}
        </button>
      ) : null}
      {staticLanguage ? (
        <span
          className={`inline-flex shrink-0 items-center whitespace-nowrap font-sans text-[14px] font-medium leading-tight ${mutedStatic}`}
          aria-hidden
        >
          {tNav('about')}
        </span>
      ) : (
        <Link href="/about" className={textLinkClass}>
          {tNav('about')}
        </Link>
      )}
      <div className="flex shrink-0 items-center gap-1.5">
        {staticLanguage ? (
          <span
            className={`flex h-6 w-6 items-center justify-center ${iconStatic}`}
            aria-hidden
          >
            <Icon name="subscribe" className="!h-[18px] !w-[18px]" />
          </span>
        ) : onIntel ? (
          <button
            type="button"
            aria-label={tFooter('subscribeAria')}
            aria-expanded={intelOpen}
            onClick={onIntel}
            className={iconBtn(intelOpen)}
          >
            <Icon name="subscribe" className="!h-[18px] !w-[18px]" />
          </button>
        ) : null}
        {staticLanguage ? (
          <span
            className={`flex h-6 w-6 items-center justify-center ${iconStatic}`}
            aria-hidden
          >
            <Icon name="bolt" className="h-4 w-4" />
          </span>
        ) : onShortcuts ? (
          <button
            type="button"
            aria-label={tFilm('keysHint')}
            aria-expanded={shortcutsOpen}
            onClick={onShortcuts}
            className={iconBtn(shortcutsOpen)}
          >
            <Icon name="bolt" className="h-4 w-4" />
          </button>
        ) : null}
        {staticLanguage ? (
          <span
            className={`flex h-6 w-6 items-center justify-center ${iconStatic}`}
            aria-hidden
          >
            <Icon name="doc" className="h-4 w-4" />
          </span>
        ) : onLegal ? (
          <button
            type="button"
            aria-label={tFooter('legalAria')}
            aria-expanded={legalOpen}
            onClick={onLegal}
            className={iconBtn(legalOpen)}
          >
            <Icon name="doc" className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="relative z-50 w-full shrink-0">
      <div className="relative grid h-[54px] w-full grid-cols-[1fr_auto_1fr] items-center gap-x-3 overflow-hidden px-6 md:px-[54px]">
        <div className="relative z-[1] min-w-0 justify-self-start">
          {left ?? <div />}
        </div>
        <div className="relative z-[1] flex max-w-full items-center justify-center gap-3 justify-self-center overflow-hidden sm:gap-4">
          {center ? (
            <div className="max-w-[40vw] overflow-hidden sm:max-w-none">
              {center}
            </div>
          ) : null}
          {utilities}
        </div>
        <div aria-hidden className="justify-self-end" />
      </div>
    </div>
  );
}
