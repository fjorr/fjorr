'use client';

import React, {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { hasHouseFooterChrome } from '@/lib/color-scheme';
import { clearBrowseReturn } from '@/lib/house-browse';
import { HOUSE_CHROME_PX, NAV_BAND_PX } from '@/lib/house-chrome';
import dynamic from 'next/dynamic';
import type { ShortcutAction } from '@/components/house/ShortcutsPanel';
import { stripLocalePrefix, type AppLocale } from '@/i18n/config';
import {
  clearLanguageHello,
  fadeLanguageHello,
  peekLanguageHello,
  resumeLanguageHello,
  showLanguageHello,
} from '@/lib/language-hello-dom';
import {
  takeSearchReopen,
  peekSearchReturn,
  clearSearchReturn,
} from '@/lib/house-search-return';
import { pathWithSearchQuery as buildSearchHref } from '@/lib/house-search-query';

const LanguagePanel = dynamic(() => import('@/components/house/LanguagePanel'), {
  ssr: false,
});
const ShortcutsPanel = dynamic(
  () => import('@/components/house/ShortcutsPanel'),
  { ssr: false }
);
const HouseLegalSheet = dynamic(() => import('@/components/HouseLegalSheet'), {
  ssr: false,
});
const HouseBureauxSheet = dynamic(
  () => import('@/components/HouseBureauxSheet'),
  { ssr: false }
);
const HouseAccountSheet = dynamic(
  () => import('@/components/HouseAccountSheet'),
  { ssr: false }
);

/**
 * House overlay rules:
 * 1. One sheet at a time — opening any sheet closes every other.
 * 2. Full white between navbar and footer (viewport), on house and scroll pages.
 * 3. Only nav + footer stay visible beside the sheet.
 * 4. Same control toggles closed; Escape closes; theater clears.
 * 5. Sheets: language · shortcuts · legal · bureaux · account.
 *    Search lives on /search. Subscribe lives on /subscribe.
 */
export type HouseSheetId =
  | 'language'
  | 'shortcuts'
  | 'legal'
  | 'bureaux'
  | 'account';

type ShortcutHandler = (action: ShortcutAction) => void;

type HouseOverlayContextValue = {
  active: HouseSheetId | null;
  open: (id: HouseSheetId) => void;
  close: () => void;
  toggle: (id: HouseSheetId) => void;
  isOpen: (id: HouseSheetId) => boolean;
  setShortcutHandler: (handler: ShortcutHandler | null) => void;
  /** Hero ↔ index view — house stage pages only. */
  browseOpen: boolean;
  setBrowseOpen: (open: boolean) => void;
  toggleBrowse: () => void;
};

const HouseOverlayContext = createContext<HouseOverlayContextValue | null>(null);

export function useHouseOverlay() {
  const ctx = useContext(HouseOverlayContext);
  if (!ctx) {
    throw new Error('useHouseOverlay must be used within HouseOverlayProvider');
  }
  return ctx;
}

export function useHouseOverlayOptional() {
  return useContext(HouseOverlayContext);
}

function goSearch(router: ReturnType<typeof useRouter>, query?: string) {
  const ret = peekSearchReturn();
  if (ret) {
    clearSearchReturn();
    const href =
      ret.path.startsWith('/search')
        ? ret.path
        : buildSearchHref('/search', '', ret.query || query || '');
    router.push(href);
    return;
  }
  router.push(buildSearchHref('/search', '', query || null));
}

export function HouseOverlayProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={children}>
      <HouseOverlayProviderInner>{children}</HouseOverlayProviderInner>
    </Suspense>
  );
}

function HouseOverlayProviderInner({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '';
  const router = useRouter();
  const locale = useLocale() as AppLocale;
  const [active, setActive] = useState<HouseSheetId | null>(null);
  const [mounted, setMounted] = useState(false);
  const [shortcutHandler, setShortcutHandlerState] =
    useState<ShortcutHandler | null>(null);
  const [browseOpen, setBrowseOpenState] = useState(false);
  /** True while an imperative Hello cover is owning the beat. */
  const [langHelloLock, setLangHelloLock] = useState(false);

  const footerChrome = hasHouseFooterChrome(pathname);
  const sheetBottom = footerChrome && active != null ? HOUSE_CHROME_PX : 0;
  const onSearchPage =
    pathname === '/search' || pathname.startsWith('/search/');

  const close = useCallback(() => setActive(null), []);
  const open = useCallback((id: HouseSheetId) => setActive(id), []);
  const toggle = useCallback((id: HouseSheetId) => {
    setActive((current) => (current === id ? null : id));
  }, []);
  const isOpen = useCallback(
    (id: HouseSheetId) => active === id,
    [active]
  );

  /** Push a route; only drop the sheet immediately when the path won’t change. */
  const leaveTo = useCallback(
    (href: string) => {
      const target = (href.split('#')[0] || '/').replace(/\/$/, '') || '/';
      const here = pathname.replace(/\/$/, '') || '/';
      router.push(href);
      if (target === here) setActive(null);
    },
    [pathname, router]
  );

  const setShortcutHandler = useCallback((handler: ShortcutHandler | null) => {
    setShortcutHandlerState(() => handler);
  }, []);

  const setBrowseOpen = useCallback((open: boolean) => {
    if (!open) clearBrowseReturn();
    setBrowseOpenState(open);
  }, []);

  const toggleBrowse = useCallback(() => {
    setBrowseOpenState((open) => {
      if (open) clearBrowseReturn();
      return !open;
    });
  }, []);

  const confirmLanguage = useCallback(
    (code: AppLocale) => {
      const raw =
        typeof window !== 'undefined' ? window.location.pathname : '/';
      const href = stripLocalePrefix(raw || '/') || '/';
      const reduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (reduced) {
        setActive(null);
        clearLanguageHello();
        router.replace(href, { locale: code });
        return;
      }

      // Cover first, then commit locale under it. Fade only after the new
      // locale is live (see locale effect) — never reveal the old language.
      setLangHelloLock(true);
      showLanguageHello(code);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setActive(null);
          router.replace(href, { locale: code });
        });
      });

      // Safety net if locale never flips (should be rare).
      window.setTimeout(() => {
        if (!peekLanguageHello()) return;
        void fadeLanguageHello().then(() => setLangHelloLock(false));
      }, 2800);
    },
    [router]
  );

  useLayoutEffect(() => {
    setMounted(true);
    // Before paint after remount: keep Hello covering so the new locale
    // chrome never flashes with the wrong language.
    resumeLanguageHello();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fade only once the live locale matches the pending target.
  useEffect(() => {
    const pending = peekLanguageHello();
    if (!pending) return;
    if (locale !== pending.locale) {
      // Still on the old tree or mid-nav — keep cover, wait.
      resumeLanguageHello();
      setLangHelloLock(true);
      return;
    }

    resumeLanguageHello();
    setLangHelloLock(true);
    const hold = Math.max(350, 1000 - (Date.now() - pending.at));
    const fadeTimer = window.setTimeout(() => {
      void fadeLanguageHello().then(() => setLangHelloLock(false));
    }, hold);
    return () => window.clearTimeout(fadeTimer);
  }, [locale]);

  useEffect(() => {
    setActive(null);
    setBrowseOpenState(false);
    const onHouse =
      pathname === '/' ||
      pathname === '/film' ||
      pathname.startsWith('/film/');
    if (!onHouse) clearBrowseReturn();
  }, [pathname]);

  useEffect(() => {
    if (active != null) {
      setBrowseOpenState(false);
      clearBrowseReturn();
    }
  }, [active]);

  useEffect(() => {
    if (browseOpen) setActive(null);
  }, [browseOpen]);

  useEffect(() => {
    const hide = () => setActive(null);
    window.addEventListener('fjorr_hide_main_navbar', hide);
    return () => window.removeEventListener('fjorr_hide_main_navbar', hide);
  }, []);

  useEffect(() => {
    if (!active && !langHelloLock) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      if (langHelloLock) return;
      setActive(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, langHelloLock]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') {
        return;
      }
      event.preventDefault();
      if (onSearchPage) {
        window.dispatchEvent(new Event('fjorr_command_open'));
        return;
      }
      goSearch(router);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSearchPage, router]);

  useEffect(() => {
    const onOpenSearch = () => {
      if (onSearchPage) {
        window.dispatchEvent(new Event('fjorr_command_open'));
        return;
      }
      goSearch(router);
    };
    window.addEventListener('fjorr_open_command', onOpenSearch);
    return () => window.removeEventListener('fjorr_open_command', onOpenSearch);
  }, [onSearchPage, router]);

  /** Theater close (or same-page return) → reopen search with prior query. */
  useEffect(() => {
    const reopen = () => {
      const query = takeSearchReopen();
      if (query == null) return;
      router.push(buildSearchHref('/search', '', query || null));
    };
    window.addEventListener('fjorr_search_reopen', reopen);
    return () => window.removeEventListener('fjorr_search_reopen', reopen);
  }, [router]);

  useEffect(() => {
    const query = takeSearchReopen();
    if (query == null) return;
    if (onSearchPage) {
      window.dispatchEvent(new Event('fjorr_command_open'));
      return;
    }
    router.push(buildSearchHref('/search', '', query || null));
  }, [pathname, onSearchPage, router]);

  const runShortcut = useCallback(
    (action: ShortcutAction) => {
      if (action === 'search') {
        setActive(null);
        goSearch(router);
        return;
      }
      if (action === 'close') {
        close();
        return;
      }
      shortcutHandler?.(action);
      if (
        action === 'play' ||
        action === 'info' ||
        action === 'browse' ||
        action === 'shuffle'
      ) {
        setActive(null);
      }
    },
    [shortcutHandler, close, router]
  );

  const value = useMemo(
    () => ({
      active,
      open,
      close,
      toggle,
      isOpen,
      setShortcutHandler,
      browseOpen,
      setBrowseOpen,
      toggleBrowse,
    }),
    [
      active,
      open,
      close,
      toggle,
      isOpen,
      setShortcutHandler,
      browseOpen,
      setBrowseOpen,
      toggleBrowse,
    ]
  );

  const sheet =
    active && mounted ? (
      <div
        className="fixed inset-x-0 top-0 z-[55] text-[#0B0B0C]"
        style={{ bottom: sheetBottom }}
        role="dialog"
        aria-modal="true"
      >
        {/* White stage starts under the floating glass pill — sides stay clear. */}
        <div
          className="absolute inset-x-0 bottom-0 overflow-hidden bg-white"
          style={{ top: NAV_BAND_PX }}
        >
          {active === 'language' ? (
            <LanguagePanel onConfirm={confirmLanguage} />
          ) : active === 'shortcuts' ? (
            <ShortcutsPanel onClose={close} onAction={runShortcut} />
          ) : active === 'legal' ? (
            <HouseLegalSheet onNavigate={leaveTo} />
          ) : active === 'bureaux' ? (
            <HouseBureauxSheet onNavigate={leaveTo} />
          ) : (
            <HouseAccountSheet onNavigate={leaveTo} />
          )}
        </div>
      </div>
    ) : null;

  return (
    <HouseOverlayContext.Provider value={value}>
      {children}
      {sheet ? createPortal(sheet, document.body) : null}
    </HouseOverlayContext.Provider>
  );
}
