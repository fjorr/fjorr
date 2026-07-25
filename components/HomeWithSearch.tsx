'use client';

import React, { Suspense, useEffect, useState, type ReactNode } from 'react';
import SearchExperience from '@/components/SearchExperience';
import { MinimalFilterProvider } from '@/components/MinimalFilterContext';
import type { HomeMix } from '@/lib/home-mix';

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

  return (
    <Suspense fallback={<div className="w-full min-h-screen bg-dark-01" />}>
      <MinimalFilterProvider initialMixes={mixes}>
        <div className="w-full min-h-screen bg-dark-01 pb-24">
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
