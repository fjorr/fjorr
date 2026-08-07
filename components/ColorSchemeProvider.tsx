'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';
import { usePathname } from '@/i18n/navigation';
import {
  type ColorScheme,
  ABOUT_PAGE_BG,
  DARK_PAGE_BG,
  DARK_PAGE_FG,
  isAboutPath,
  isColorSchemeLockedPath,
  LIGHT_PAGE_BG,
  LIGHT_PAGE_FG,
  readColorSchemeCookie,
  writeColorSchemeCookie,
} from '@/lib/color-scheme';

type ColorSchemeContextValue = {
  /** Preference from cookie (may differ from applied while on locked pages). */
  preference: ColorScheme;
  /** What’s actually on `<html>` right now. */
  applied: ColorScheme;
  isLight: boolean;
  isLocked: boolean;
  setScheme: (scheme: ColorScheme) => void;
  toggleScheme: () => void;
};

const ColorSchemeContext = createContext<ColorSchemeContextValue | null>(null);

function applyDomScheme(
  scheme: ColorScheme,
  locked: boolean,
  pathname: string
) {
  const root = document.documentElement;
  // Locked routes (about, partner, …) always paint dark — even if preference is light.
  const effective: ColorScheme = locked ? 'dark' : scheme;
  root.classList.toggle('dark', effective === 'dark');
  root.classList.toggle('light', effective === 'light');
  root.dataset.colorScheme = effective;
  root.style.colorScheme = effective;

  const bg = isAboutPath(pathname)
    ? ABOUT_PAGE_BG
    : effective === 'light'
      ? LIGHT_PAGE_BG
      : DARK_PAGE_BG;
  const fg = effective === 'light' ? LIGHT_PAGE_FG : DARK_PAGE_FG;
  // Always set (don’t leave prior light inline vars stuck on locked pages).
  root.style.setProperty('--page-bg', bg);
  root.style.setProperty('--page-fg', fg);
  root.style.setProperty('--page-bg-color', bg);
}

export function ColorSchemeProvider({
  children,
  initialScheme = 'dark',
}: {
  children: React.ReactNode;
  initialScheme?: ColorScheme;
}) {
  const pathname = usePathname() || '/';
  const [preference, setPreference] = useState<ColorScheme>(initialScheme);
  const locked = isColorSchemeLockedPath(pathname);
  const applied: ColorScheme = locked ? 'dark' : preference;

  useEffect(() => {
    setPreference(readColorSchemeCookie());
  }, []);

  // Layout effect so about’s true-black surface lands before paint.
  useLayoutEffect(() => {
    applyDomScheme(preference, locked, pathname);
  }, [preference, locked, pathname]);

  const setScheme = useCallback((next: ColorScheme) => {
    setPreference(next);
    writeColorSchemeCookie(next);
  }, []);

  const toggleScheme = useCallback(() => {
    setScheme(preference === 'light' ? 'dark' : 'light');
  }, [preference, setScheme]);

  return (
    <ColorSchemeContext.Provider
      value={{
        preference,
        applied,
        isLight: applied === 'light',
        isLocked: locked,
        setScheme,
        toggleScheme,
      }}
    >
      {children}
    </ColorSchemeContext.Provider>
  );
}

export function useColorScheme() {
  const ctx = useContext(ColorSchemeContext);
  if (!ctx) {
    throw new Error('useColorScheme must be used within ColorSchemeProvider');
  }
  return ctx;
}
