'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { FjorrWordmark } from '@/components/brand/FjorrMarks';
import NavbarAccountLink from '@/components/NavbarAccountLink';
import NavbarJoinLink from '@/components/NavbarJoinLink';
import { useHouseOverlay } from '@/components/HouseOverlayProvider';
import { Icon } from '@/components/ui/Icons';
import { peekSearchReturn } from '@/lib/house-search-return';

interface NavbarProps {
  variant?: 'light' | 'dark';
}

const SCROLL_GLASS_PX = 40;

function pageNeedsScroll() {
  if (typeof window === 'undefined') return false;
  return (
    document.documentElement.scrollHeight > window.innerHeight + SCROLL_GLASS_PX
  );
}

/**
 * Floating glass chip — same position on every page.
 * Glass only when the page can scroll and the user has scrolled;
 * never while a footer sheet is open.
 *
 * While a sheet is open the chip portals to document.body so it can sit
 * above the sheet (house/film shells are z-40 and would otherwise trap it).
 */
function Navbar({ variant = 'light' }: NavbarProps) {
  const t = useTranslations('Nav');
  const pathname = usePathname() || '';
  const { active, close, toggle, isOpen } = useHouseOverlay();
  const [isTheaterOpen, setIsTheaterOpen] = useState(false);
  const [scrolledPast, setScrolledPast] = useState(false);
  const [canScroll, setCanScroll] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [hasSearchReturn, setHasSearchReturn] = useState(false);
  const sheetOpen = active != null;
  const searchOpen = isOpen('search');
  const showBackToIndex = hasSearchReturn && !searchOpen;

  // Sheets are a white stage — use dark (black) type over them.
  const chromeVariant = sheetOpen ? 'dark' : variant;
  const textColor = chromeVariant === 'light' ? 'text-white' : 'text-black';
  const iconColor = chromeVariant === 'light' ? 'text-white/55' : 'text-black/55';
  const controlHover =
    chromeVariant === 'light' ? 'hover:text-white' : 'hover:text-black';

  const glassAnimClass =
    chromeVariant === 'light' ? 'animate-nav-glass' : 'animate-nav-glass-light';

  const showGlass = !sheetOpen && canScroll && scrolledPast;

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    const sync = () => setHasSearchReturn(Boolean(peekSearchReturn()));
    sync();
    window.addEventListener('fjorr_search_return', sync);
    return () => window.removeEventListener('fjorr_search_return', sync);
  }, [pathname, active]);

  useEffect(() => {
    if (sheetOpen) {
      setScrolledPast(false);
      setCanScroll(false);
      return;
    }

    const measure = () => {
      const needs = pageNeedsScroll();
      setCanScroll(needs);
      setScrolledPast(needs && window.scrollY > SCROLL_GLASS_PX);
    };

    measure();
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [pathname, sheetOpen]);

  useEffect(() => {
    const handleHide = () => {
      setIsTheaterOpen(true);
      close();
    };
    const handleShow = () => setIsTheaterOpen(false);

    window.addEventListener('fjorr_hide_main_navbar', handleHide);
    window.addEventListener('fjorr_show_main_navbar', handleShow);
    return () => {
      window.removeEventListener('fjorr_hide_main_navbar', handleHide);
      window.removeEventListener('fjorr_show_main_navbar', handleShow);
    };
  }, [close]);

  if (isTheaterOpen) return null;

  const searchBtn = (
    <button
      type="button"
      onClick={() => toggle('search')}
      aria-keyshortcuts="Meta+K"
      aria-expanded={searchOpen}
      aria-label={showBackToIndex ? t('backToIndexAria') : t('openCommand')}
      className={`inline-flex h-8 items-center gap-1.5 bg-transparent p-0 font-sans text-[12px] font-medium transition-colors ${iconColor} ${controlHover}`}
    >
      {showBackToIndex ? (
        <ArrowLeft className="size-[14px]" strokeWidth={2.25} aria-hidden />
      ) : (
        <Icon name="search" className="h-3.5 w-3.5" aria-hidden />
      )}
      <span>{t('search')}</span>
      <span className="opacity-70">⌘K</span>
    </button>
  );

  const wordmark = (
    <Link
      href="/"
      onClick={() => {
        // Pathname effect closes the sheet after navigation; same-route needs a tap-close.
        if (pathname === '/') close();
      }}
      className={`flex shrink-0 items-center ${textColor}`}
      aria-label="Fjorr home"
    >
      <FjorrWordmark className="h-[20px] w-[33px]" />
    </Link>
  );

  const accountSide = (
    <div className="flex items-center gap-3 sm:gap-3.5">
      <NavbarJoinLink
        className={controlHover}
        mutedClassName={iconColor}
        activeClassName={textColor}
      />
      <NavbarAccountLink
        className={controlHover}
        mutedClassName={iconColor}
        activeClassName={textColor}
      />
    </div>
  );

  const header = (
    <header
      className={`pointer-events-none flex h-[56px] w-full items-center justify-center overflow-visible px-4 ${
        sheetOpen
          ? 'fixed inset-x-0 top-0 z-[60]'
          : 'sticky top-0 z-50'
      }`}
    >
      <div
        className={`pointer-events-auto inline-flex h-[44px] max-w-[calc(100vw-2rem)] items-center gap-3.5 rounded-[10px] border px-4 sm:gap-5 sm:px-5 ${
          sheetOpen
            ? 'border-transparent bg-white'
            : showGlass
              ? `${glassAnimClass} nav-glass-scrolled`
              : 'border-transparent bg-transparent'
        }`}
      >
        {searchBtn}
        {wordmark}
        {accountSide}
      </div>
      {showGlass ? (
        <style
          dangerouslySetInnerHTML={{
            __html: `
        .animate-nav-glass.nav-glass-scrolled {
          background-color: color-mix(in srgb, var(--page-bg-color, #1F1F1F) 72%, transparent);
          border-color: rgba(255, 255, 255, 0.1);
          -webkit-backdrop-filter: blur(24px) saturate(1.4);
          backdrop-filter: blur(24px) saturate(1.4);
        }

        .animate-nav-glass-light.nav-glass-scrolled {
          background-color: color-mix(in srgb, var(--page-bg-color, #ffffff) 78%, transparent);
          border-color: rgba(0, 0, 0, 0.06);
          -webkit-backdrop-filter: blur(24px) saturate(1.4);
          backdrop-filter: blur(24px) saturate(1.4);
        }
      `,
          }}
        />
      ) : null}
    </header>
  );

  // Escape house/film z-40 shells so the chip stacks above the sheet portal.
  if (sheetOpen && portalReady) {
    return (
      <>
        <div className="h-[56px] w-full shrink-0" aria-hidden />
        {createPortal(header, document.body)}
      </>
    );
  }

  return header;
}

export default Navbar;
