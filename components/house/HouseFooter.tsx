'use client';

import React, { type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { localeLabels, type AppLocale } from '@/i18n/config';
import { Icon } from '@/components/ui/Icons';
import { useHouseOverlayOptional } from '@/components/HouseOverlayProvider';

type Props = {
  left?: ReactNode;
  /** Poster dots — joins the centered utility cluster when present. */
  center?: ReactNode;
  langOpen?: boolean;
  shortcutsOpen?: boolean;
  legalOpen?: boolean;
  onLanguage?: () => void;
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
  shortcutsOpen = false,
  onLanguage,
  onShortcuts,
  staticLanguage = false,
  variant = 'dark',
}: Props) {
  const tNav = useTranslations('Nav');
  const tFilm = useTranslations('Film');
  const tFooter = useTranslations('Footer');
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const overlay = useHouseOverlayOptional();
  const onSubscribe =
    pathname === '/subscribe' || pathname.startsWith('/subscribe/');
  const onNominate = pathname === '/nominate' || pathname.startsWith('/nominate/');
  const subscribeActive = onSubscribe && !langOpen && !shortcutsOpen;
  const onLegalPages =
    pathname === '/legal' ||
    pathname.startsWith('/legal/') ||
    pathname === '/privacy' ||
    pathname.startsWith('/privacy/') ||
    pathname === '/terms' ||
    pathname.startsWith('/terms/');
  const label = localeLabels[locale];
  const onDark = variant === 'light';

  const handleSubscribeClick = (
    event: React.MouseEvent<HTMLAnchorElement>
  ) => {
    // Same-route Link is a no-op — close the open sheet so the icon works.
    if (onSubscribe) event.preventDefault();
    if (overlay?.active) overlay.close();
  };

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

  const textLinkClass = (active: boolean) =>
    `inline-flex shrink-0 items-center bg-transparent p-0 font-sans text-[14px] font-medium leading-tight tracking-normal transition-colors ${
      active ? activeText : idleText
    }`;

  const languageClass = `inline-flex shrink-0 items-center bg-transparent p-0 font-sans text-[14px] font-medium leading-tight tracking-normal transition-colors ${
    langOpen ? activeText : idleText
  }`;

  const iconBtn = (active: boolean) =>
    `flex h-6 w-6 items-center justify-center transition-colors ${
      active ? iconActive : iconIdle
    }`;

  const languageControl = staticLanguage ? (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap font-sans text-[14px] font-medium leading-tight ${mutedStatic}`}
      aria-hidden
    >
      {label}
    </span>
  ) : onLanguage ? (
    <button
      type="button"
      aria-label={tNav('language')}
      aria-expanded={langOpen}
      onClick={onLanguage}
      className={languageClass}
    >
      <span className="whitespace-nowrap leading-tight">{label}</span>
    </button>
  ) : null;

  const wordClass = `inline-flex shrink-0 items-center whitespace-nowrap font-sans text-[14px] font-medium leading-tight ${mutedStatic}`;

  const words = (
    <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
      {staticLanguage ? (
        <>
          <span className={wordClass} aria-hidden>
            {tNav('nominate')}
          </span>
          <span className={wordClass} aria-hidden>
            {tNav('about')}
          </span>
        </>
      ) : (
        <>
          <Link
            href="/nominate"
            aria-current={onNominate ? 'page' : undefined}
            className={textLinkClass(onNominate)}
          >
            {tNav('nominate')}
          </Link>
          <Link href="/about" className={textLinkClass(false)}>
            {tNav('about')}
          </Link>
        </>
      )}
    </div>
  );

  const tools = (
    <div className="flex shrink-0 items-center gap-2 md:gap-3">
      <div className="flex shrink-0 items-center gap-1.5">
        {staticLanguage ? (
          <span
            className={`flex h-6 w-6 items-center justify-center ${iconStatic}`}
            aria-hidden
          >
            <Icon name="rss" className="!h-3.5 !w-3.5" />
          </span>
        ) : (
          <Link
            href="/subscribe"
            aria-label={tFooter('subscribeAria')}
            aria-current={onSubscribe ? 'page' : undefined}
            onClick={handleSubscribeClick}
            className={iconBtn(subscribeActive)}
          >
            <Icon name="rss" className="!h-3.5 !w-3.5" />
          </Link>
        )}
        {staticLanguage ? (
          <span
            className={`flex h-6 w-6 items-center justify-center ${iconStatic}`}
            aria-hidden
          >
            <Icon name="command" className="!h-3.5 !w-3.5" />
          </span>
        ) : onShortcuts ? (
          <button
            type="button"
            aria-label={tFilm('keysHint')}
            aria-expanded={shortcutsOpen}
            onClick={onShortcuts}
            className={iconBtn(shortcutsOpen)}
          >
            <Icon name="command" className="!h-3.5 !w-3.5" />
          </button>
        ) : null}
      </div>
      {languageControl}
    </div>
  );

  const year = new Date().getFullYear();

  return (
    <div className="relative z-50 w-full shrink-0">
      <div className="relative flex h-[54px] w-full items-center justify-center gap-x-5 overflow-hidden px-6 md:grid md:grid-cols-[1fr_auto_1fr] md:gap-x-3 md:px-[54px]">
        <div className="relative z-[1] flex min-w-0 items-center gap-3 md:justify-self-start">
          {left}
          {tools}
        </div>
        <div className="relative z-[1] flex min-w-0 max-w-full items-center gap-3 overflow-hidden sm:gap-4 md:justify-center md:justify-self-center">
          {center ? (
            <div className="max-w-[40vw] overflow-hidden sm:max-w-none">
              {center}
            </div>
          ) : null}
          {words}
        </div>
        <div className="relative z-[1] hidden items-center gap-2.5 whitespace-nowrap md:flex md:justify-self-end">
          {staticLanguage ? (
            <span
              className={`font-sans text-[10px] font-medium tracking-tight ${mutedStatic}`}
              aria-hidden
            >
              {tFooter('legalAria')}
            </span>
          ) : (
            <Link
              href="/legal"
              aria-current={onLegalPages ? 'page' : undefined}
              className={`font-sans text-[10px] font-medium tracking-tight transition-colors ${idleText}`}
            >
              {tFooter('legalAria')}
            </Link>
          )}
          <p
            className={`m-0 font-sans text-[10px] font-medium tracking-tight ${
              onDark ? 'text-white/40' : 'text-black/40'
            }`}
            aria-hidden
          >
            © {year} Fjorr
          </p>
        </div>
      </div>
    </div>
  );
}
