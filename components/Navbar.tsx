'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { FjorrWordmark } from '@/components/brand/FjorrMarks';
import NavbarAccountLink from '@/components/NavbarAccountLink';
import NavbarJoinLink from '@/components/NavbarJoinLink';
import { useHouseOverlay } from '@/components/HouseOverlayProvider';
import { Icon } from '@/components/ui/Icons';
import {
  clearSearchReturn,
  peekSearchReturn,
} from '@/lib/house-search-return';
import { pathWithSearchQuery } from '@/lib/house-search-query';
import { NAV_BAND_PX } from '@/lib/house-chrome';

interface NavbarProps {
  variant?: 'light' | 'dark';
  /**
   * Join / full-bleed heroes: chip floats over the surface — text + wordmark only.
   * No white band, no glass.
   */
  overlay?: boolean;
  /**
   * Film info (ExhibitionSheet) is open — chip glasses over that sheet’s scroll
   * instead of the window. Band stays transparent so white info shows through.
   */
  surfaceScroll?: boolean;
}

const SCROLL_GLASS_PX = 40;

function pageNeedsScroll() {
  if (typeof window === 'undefined') return false;
  return (
    document.documentElement.scrollHeight > window.innerHeight + SCROLL_GLASS_PX
  );
}

/**
 * Mobile chrome:
 * 1. At rest — 54px white top margin with the compact pill centered in it.
 * 2. On scroll — white margin scrolls away; sticky glass pill remains.
 *
 * Sheets portal the header above house z-40 shells.
 */
function Navbar({
  variant = 'light',
  overlay = false,
  surfaceScroll = false,
}: NavbarProps) {
  const t = useTranslations('Nav');
  const pathname = usePathname() || '';
  const router = useRouter();
  const { active, close } = useHouseOverlay();
  const [isTheaterOpen, setIsTheaterOpen] = useState(false);
  const [scrolledPast, setScrolledPast] = useState(false);
  const [canScroll, setCanScroll] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [hasSearchReturn, setHasSearchReturn] = useState(false);
  const sheetOpen = active != null;
  const onSearchPage =
    pathname === '/search' || pathname.startsWith('/search/');
  const showBackToIndex = hasSearchReturn && !onSearchPage;

  // Sheets + film info are white stages — dark (black) type.
  const chromeVariant =
    sheetOpen || surfaceScroll ? 'dark' : variant;
  const textColor = chromeVariant === 'light' ? 'text-white' : 'text-black';
  const iconColor = chromeVariant === 'light' ? 'text-white/55' : 'text-black/55';
  const controlHover =
    chromeVariant === 'light' ? 'hover:text-white' : 'hover:text-black';

  const glassAnimClass =
    chromeVariant === 'light' ? 'animate-nav-glass' : 'animate-nav-glass-light';

  /** Glass after scroll — film info uses its own scroll; overlay heroes never. */
  const showGlass = overlay
    ? false
    : sheetOpen
      ? false
      : canScroll && scrolledPast;

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
    if (overlay) {
      setScrolledPast(false);
      setCanScroll(false);
      return;
    }

    if (sheetOpen) {
      setScrolledPast(false);
      setCanScroll(false);
      return;
    }

    if (surfaceScroll) {
      setScrolledPast(false);
      setCanScroll(false);
      const onInfoScroll = (event: Event) => {
        const detail = (
          event as CustomEvent<{ scrollTop: number; canScroll: boolean }>
        ).detail;
        setCanScroll(Boolean(detail?.canScroll));
        setScrolledPast(
          Boolean(detail?.canScroll) &&
            (detail?.scrollTop ?? 0) > SCROLL_GLASS_PX
        );
      };
      window.addEventListener('fjorr_info_scroll', onInfoScroll);
      return () => {
        window.removeEventListener('fjorr_info_scroll', onInfoScroll);
      };
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
  }, [pathname, sheetOpen, overlay, surfaceScroll]);

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

  const openSearch = () => {
    if (onSearchPage) {
      window.dispatchEvent(new Event('fjorr_command_open'));
      return;
    }
    const ret = peekSearchReturn();
    if (ret) {
      clearSearchReturn();
      const href = ret.path.startsWith('/search')
        ? ret.path
        : pathWithSearchQuery('/search', '', ret.query);
      router.push(href);
      return;
    }
    router.push('/search');
  };

  const searchBtn = (
    <button
      type="button"
      onClick={openSearch}
      aria-keyshortcuts="Meta+K"
      aria-current={onSearchPage ? 'page' : undefined}
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

  const pill = (
    <div
      className={`pointer-events-auto inline-flex h-[44px] w-max max-w-[calc(100vw-2rem)] shrink-0 items-center gap-3.5 rounded-[10px] border px-4 sm:gap-5 sm:px-5 ${
        showGlass
          ? `${glassAnimClass} nav-glass-scrolled`
          : 'border-transparent bg-transparent'
      }`}
    >
      {searchBtn}
      {wordmark}
      {accountSide}
    </div>
  );

  const glassStyle = showGlass ? (
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
  ) : null;

  // Overlay heroes (Join): transparent chip only — no band, no glass.
  if (overlay && !sheetOpen) {
    return (
      <header
        className="pointer-events-none flex w-full items-center justify-center bg-transparent px-4"
        style={{ height: NAV_BAND_PX }}
      >
        {pill}
      </header>
    );
  }

  // Sheet: fixed white band + pill (search gains glass after its own scroll).
  if (sheetOpen) {
    const sheetHeader = (
      <header className="pointer-events-none fixed inset-x-0 top-0 z-[60] w-full">
        <div
          className={`pointer-events-none flex w-full items-center justify-center px-4 ${
            showGlass ? 'bg-transparent' : 'bg-white'
          }`}
          style={{ height: NAV_BAND_PX }}
        >
          {pill}
        </div>
        {glassStyle}
      </header>
    );
    if (!portalReady) {
      return (
        <div
          className="w-full shrink-0 bg-white"
          style={{ height: NAV_BAND_PX }}
          aria-hidden
        />
      );
    }
    return (
      <>
        <div
          className="w-full shrink-0 bg-white"
          style={{ height: NAV_BAND_PX }}
          aria-hidden
        />
        {createPortal(sheetHeader, document.body)}
      </>
    );
  }

  // Page: in-flow top margin (scrolls away) + sticky pill pulled up into it.
  // Band follows --page-bg-color; film info keeps white so it fuses with the sheet.
  const bandStyle = {
    height: NAV_BAND_PX,
    backgroundColor: surfaceScroll
      ? '#ffffff'
      : 'var(--page-bg-color, #ffffff)',
  } as React.CSSProperties;

  return (
    <>
      <div className="w-full shrink-0" style={bandStyle} aria-hidden />
      <header
        className="pointer-events-none sticky top-0 z-[60] w-full"
        style={{ marginTop: -NAV_BAND_PX }}
      >
        <div
          className="pointer-events-none flex w-full items-center justify-center bg-transparent px-4"
          style={{ height: NAV_BAND_PX }}
        >
          {pill}
        </div>
        {glassStyle}
      </header>
    </>
  );
}

export default Navbar;
