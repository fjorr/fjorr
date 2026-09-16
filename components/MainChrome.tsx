'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from '@/i18n/navigation';
import Navbar from '@/components/Navbar';
import { useColorScheme } from '@/components/ColorSchemeProvider';
import {
  isAboutBlackPath,
  isAboutRootPath,
  isColorSchemeLockedPath,
  isEssayFailurePath,
} from '@/lib/color-scheme';

/**
 * Client chrome only — pathname / scheme for nav.
 * Kept out of the (main) layout so page trees stay RSC.
 *
 * Classic Footer retired — house/scroll pages use HouseFooter / HouseScrollFooter.
 * House home/film mount Navbar themselves inside the fixed house shell.
 */
export default function MainChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const isWatchPage = pathname.startsWith('/watch');
  const isHome = pathname === '/';
  const isFilmPoster = pathname.startsWith('/film/');
  const isBureauxJoinPage = pathname === '/bureaux';
  const isLegalPage =
    pathname === '/privacy' ||
    pathname === '/terms' ||
    pathname.startsWith('/privacy/') ||
    pathname.startsWith('/terms/');
  const path =
    pathname.replace(/^\/(en|es|fr|it|de|pt|sv|hi|ko|ja|zh-tw)(?=\/|$)/, '') ||
    '/';
  const isSubscribePage =
    path === '/subscribe' || path.startsWith('/subscribe/');
  const isSearchPage = path === '/search' || path.startsWith('/search/');
  const isPartnerPage =
    path === '/partner' || path.startsWith('/partner/');
  const isAccountPage =
    path === '/account' || path.startsWith('/account/');
  const isEarlyReleasePage =
    path === '/account/early' || path.startsWith('/account/early/');
  const isEssayPage = isEssayFailurePath(pathname);
  const isAboutRoot = isAboutRootPath(pathname);
  const aboutBlackPage = isAboutBlackPath(pathname);
  const houseShell = isHome || isFilmPoster || isEarlyReleasePage;
  const hideChrome = isWatchPage || houseShell || isBureauxJoinPage;
  const isArtifactPage = pathname.startsWith('/artifact/');
  const isLocked = isColorSchemeLockedPath(pathname);
  const { isLight } = useColorScheme();
  const [aboutOverHero, setAboutOverHero] = useState(true);

  useEffect(() => {
    if (!isAboutRoot) {
      setAboutOverHero(false);
      return;
    }
    setAboutOverHero(true);
    const onAboutHero = (event: Event) => {
      const detail = (event as CustomEvent<boolean>).detail;
      setAboutOverHero(Boolean(detail));
    };
    window.addEventListener('fjorr:about-hero', onAboutHero);
    return () => window.removeEventListener('fjorr:about-hero', onAboutHero);
  }, [isAboutRoot]);

  const paperPage =
    isLegalPage ||
    isSubscribePage ||
    isSearchPage ||
    isPartnerPage ||
    (isAccountPage && !isEarlyReleasePage) ||
    isEssayPage;
  const heroPaperPage = isAboutRoot;
  const overHero = isAboutRoot ? aboutOverHero : false;
  const navVariant = heroPaperPage
    ? overHero
      ? 'light'
      : 'dark'
    : paperPage
      ? 'dark'
      : isLocked || !isLight
        ? 'light'
        : 'dark';

  useEffect(() => {
    if (isArtifactPage) {
      const dbColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--page-bg-color')
        .trim();

      if (dbColor) {
        document.body.style.setProperty('background-color', dbColor, 'important');
      } else {
        document.body.style.setProperty(
          'background-color',
          'var(--page-bg-color)',
          'important'
        );
      }
    } else if (paperPage) {
      document.body.style.setProperty('background-color', '#ffffff', 'important');
    } else if (heroPaperPage) {
      document.body.style.setProperty(
        'background-color',
        overHero ? '#000000' : '#ffffff',
        'important'
      );
    } else {
      document.body.style.removeProperty('background-color');
    }
  }, [pathname, isArtifactPage, paperPage, heroPaperPage, overHero]);

  return (
    <div
      style={
        isArtifactPage
          ? {
              backgroundColor: 'var(--page-bg-color)',
              transition: 'background-color 500ms cubic-bezier(0.25, 1, 0.5, 1)',
            }
          : paperPage
            ? ({
                ['--page-bg-color' as string]: '#ffffff',
                ['--page-fg' as string]: '#0B0B0C',
              } as React.CSSProperties)
            : heroPaperPage
              ? ({
                  ['--page-bg-color' as string]: overHero
                    ? '#000000'
                    : '#ffffff',
                  ['--page-fg' as string]: overHero ? '#F5F5F7' : '#0B0B0C',
                } as React.CSSProperties)
              : undefined
      }
      className={`relative flex min-h-screen flex-col justify-between text-[var(--page-fg)] ${
        aboutBlackPage || (heroPaperPage && overHero)
          ? 'bg-black'
          : paperPage || heroPaperPage
            ? 'bg-white text-[#0B0B0C]'
            : 'bg-[var(--page-bg)]'
      }`}
    >
      {!hideChrome && <Navbar variant={navVariant} />}

      <main className="relative flex w-full flex-grow flex-col">{children}</main>
    </div>
  );
}
