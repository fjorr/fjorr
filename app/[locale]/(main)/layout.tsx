'use client';

import React, { useEffect } from 'react';
import { usePathname } from '@/i18n/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useColorScheme } from '@/components/ColorSchemeProvider';
import { isColorSchemeLockedPath } from '@/lib/color-scheme';

export default function LayoutClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const isWatchPage = pathname.startsWith('/watch');
  const isArtifactPage = pathname.startsWith('/artifact/');
  const isLocked = isColorSchemeLockedPath(pathname);
  const { isLight } = useColorScheme();

  // Navbar: white text on dark surfaces, black text on light.
  // Locked pages (about/partner) always use the dark-surface nav (white type),
  // even when the user’s global preference is light.
  const navVariant = isLocked || !isLight ? 'light' : 'dark';
  const footerVariant = isLocked || !isLight ? 'light' : 'dark';

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
    } else {
      document.body.style.removeProperty('background-color');
    }
  }, [pathname, isArtifactPage]);

  return (
    <div
      style={
        isArtifactPage
          ? {
              backgroundColor: 'var(--page-bg-color)',
              transition: 'background-color 500ms cubic-bezier(0.25, 1, 0.5, 1)',
            }
          : undefined
      }
      className="relative flex flex-col min-h-screen justify-between bg-[var(--page-bg)] text-[var(--page-fg)]"
    >
      {!isWatchPage && <Navbar variant={navVariant} />}

      <main className="flex-grow w-full relative">{children}</main>

      {!isWatchPage && <Footer variant={footerVariant} />}
    </div>
  );
}
