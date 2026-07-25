'use client';

import React, { Suspense, useCallback, useEffect, useState, type ReactNode } from 'react';
import SearchExperience from '@/components/SearchExperience';
import { MinimalFilterProvider } from '@/components/MinimalFilterContext';
import type { HomeMix } from '@/lib/home-mix';

/**
 * Home shell: search bar at top; browse content below hides while searching.
 * Pass server-rendered FeatureRail / cine grid / mini list as children.
 */
export default function HomeWithSearch({
  children,
  mixes = [],
}: {
  children: ReactNode;
  mixes?: HomeMix[];
}) {
  const [searchActive, setSearchActive] = useState(false);
  const [theaterOpen, setTheaterOpen] = useState(false);

  const handleSearchActiveChange = useCallback((active: boolean) => {
    setSearchActive(active);
  }, []);

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

  return (
    <Suspense fallback={<div className="w-full min-h-screen bg-dark-01" />}>
      <MinimalFilterProvider initialMixes={mixes}>
        <div className="w-full min-h-screen bg-dark-01 pb-24">
          <h1 className="sr-only">Fjorr — Short films of the world&apos;s greatest stories</h1>
          <section
            className={`relative z-30 w-full pt-4 pb-4 px-[10%] flex flex-col items-center ${
              theaterOpen ? 'invisible pointer-events-none' : ''
            }`}
            aria-hidden={theaterOpen}
          >
            <SearchExperience
              className="w-full max-w-4xl flex flex-col items-center gap-8"
              onSearchActiveChange={handleSearchActiveChange}
            />
          </section>

          <div
            className={`relative z-0 w-full ${searchActive ? 'hidden' : 'animate-in fade-in duration-300'}`}
            aria-hidden={searchActive}
          >
            {children}
          </div>
        </div>
      </MinimalFilterProvider>
    </Suspense>
  );
}
