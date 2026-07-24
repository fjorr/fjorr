'use client';

import React, { Suspense, useCallback, useState, type ReactNode } from 'react';
import SearchExperience from '@/components/SearchExperience';
import { MinimalFilterProvider } from '@/components/MinimalFilterContext';

/**
 * Home shell: search bar at top; browse content below hides while searching.
 * Pass server-rendered rails / minimal list as children.
 */
export default function HomeWithSearch({ children }: { children: ReactNode }) {
  const [searchActive, setSearchActive] = useState(false);
  const handleSearchActiveChange = useCallback((active: boolean) => {
    setSearchActive(active);
  }, []);

  return (
    <Suspense fallback={<div className="w-full min-h-screen bg-dark-01" />}>
      <MinimalFilterProvider>
        <div className="w-full min-h-screen bg-dark-01 pb-24">
          <h1 className="sr-only">Fjorr — Short films of the world&apos;s greatest stories</h1>
          <section className="relative z-40 w-full pt-4 pb-4 px-[10%] flex flex-col items-center">
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
