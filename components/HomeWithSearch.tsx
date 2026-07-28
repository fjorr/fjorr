'use client';

import React, { Suspense, useEffect, useState, type ReactNode } from 'react';
import SearchExperience from '@/components/SearchExperience';
import { MinimalFilterProvider } from '@/components/MinimalFilterContext';
import type { HomeMix } from '@/lib/home-mix';
import { preloadCinemaTheater } from '@/lib/cinema-theater';

/**
 * Home shell: search chrome at top; browse content below hides while searching.
 * Pass server-rendered FeatureRail / cine grid / mini list / timeline as children.
 */
export default function HomeWithSearch({
  children,
  mixes = [],
}: {
  children: ReactNode;
  mixes?: HomeMix[];
}) {
  const [theaterOpen, setTheaterOpen] = useState(false);

  // CinemaTheater dispatches the same events Navbar uses — hide search chrome over the player.
  useEffect(() => {
    const hide = () => setTheaterOpen(true);
    const show = () => setTheaterOpen(false);
    window.addEventListener('fjorr_hide_main_navbar', hide);
    window.addEventListener('fjorr_show_main_navbar', show);
    return () => {
      window.removeEventListener('fjorr_hide_main_navbar', hide);
      window.removeEventListener('fjorr_show_main_navbar', show);
    };
  }, []);

  // Warm theater after first paint / idle — don't race hero LCP.
  useEffect(() => {
    const warm = () => {
      const conn = (navigator as Navigator & {
        connection?: { saveData?: boolean };
      }).connection;
      if (conn?.saveData) return;
      void preloadCinemaTheater();
    };

    const ric = (
      window as Window & {
        requestIdleCallback?: (
          cb: () => void,
          opts?: { timeout: number }
        ) => number;
        cancelIdleCallback?: (id: number) => void;
      }
    ).requestIdleCallback;

    if (typeof ric === 'function') {
      const id = ric(warm, { timeout: 6000 });
      return () => {
        (
          window as Window & { cancelIdleCallback?: (id: number) => void }
        ).cancelIdleCallback?.(id);
      };
    }

    const t = window.setTimeout(warm, 2500);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <Suspense fallback={<div className="w-full min-h-screen bg-[var(--page-bg)]" />}>
      <MinimalFilterProvider initialMixes={mixes}>
        <div className="w-full min-h-screen bg-[var(--page-bg)] text-[var(--page-fg)] pb-24">
          <h1 className="sr-only">Fjorr — Short films of the world&apos;s greatest stories</h1>
          <SearchExperience
            browseContent={children}
            theaterOpen={theaterOpen}
          />
        </div>
      </MinimalFilterProvider>
    </Suspense>
  );
}
