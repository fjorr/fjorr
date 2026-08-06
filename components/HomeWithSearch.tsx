'use client';

import React, {
  Suspense,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import dynamic from 'next/dynamic';
import { MinimalFilterProvider } from '@/components/MinimalFilterContext';
import type { HomeMix } from '@/lib/home-mix';
import { preloadCinemaTheater } from '@/lib/cinema-theater';

const SearchExperience = dynamic(() => import('@/components/SearchExperience'), {
  ssr: false,
  loading: () => (
    <div className="w-full pt-4 pb-4 px-[10%] flex flex-col items-center">
      <div className="w-full max-w-sm h-11 rounded-[10px] bg-page-chip animate-pulse" />
    </div>
  ),
});

/**
 * Home shell: defer SearchExperience (and Supabase) until idle / query / focus.
 * Browse children stay mounted for LCP.
 */
export default function HomeWithSearch({
  children,
  mixes = [],
}: {
  children: ReactNode;
  mixes?: HomeMix[];
}) {
  const [theaterOpen, setTheaterOpen] = useState(false);
  const [searchReady, setSearchReady] = useState(false);

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

  // Mount search on ?q=, first interaction, or after a short idle.
  useEffect(() => {
    if (searchReady) return;
    const params = new URLSearchParams(window.location.search);
    if (params.has('q') || params.has('mix')) {
      setSearchReady(true);
      return;
    }

    const activate = () => setSearchReady(true);
    const onPointer = () => activate();
    const onKey = () => activate();
    window.addEventListener('pointerdown', onPointer, { once: true, passive: true });
    window.addEventListener('keydown', onKey, { once: true });

    let idleId: number | undefined;
    let timeoutId: number | undefined;
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
      idleId = ric(activate, { timeout: 2000 });
    } else {
      timeoutId = window.setTimeout(activate, 1200);
    }

    return () => {
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKey);
      if (idleId != null) {
        (
          window as Window & { cancelIdleCallback?: (id: number) => void }
        ).cancelIdleCallback?.(idleId);
      }
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, [searchReady]);

  // Warm theater after load + idle — don't race hero LCP.
  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: number | undefined;

    const warm = () => {
      if (cancelled) return;
      const conn = (navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }).connection;
      if (conn?.saveData) return;
      if (conn?.effectiveType === 'slow-2g' || conn?.effectiveType === '2g') {
        return;
      }
      void preloadCinemaTheater();
    };

    const schedule = () => {
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
        idleId = ric(warm, { timeout: 10000 });
      } else {
        timeoutId = window.setTimeout(warm, 5000);
      }
    };

    if (document.readyState === 'complete') {
      schedule();
    } else {
      window.addEventListener('load', schedule, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener('load', schedule);
      if (idleId != null) {
        (
          window as Window & { cancelIdleCallback?: (id: number) => void }
        ).cancelIdleCallback?.(idleId);
      }
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <Suspense fallback={<div className="w-full min-h-screen bg-[var(--page-bg)]" />}>
      <MinimalFilterProvider initialMixes={mixes}>
        <div className="w-full min-h-screen bg-[var(--page-bg)] text-[var(--page-fg)] pb-24">
          <h1 className="sr-only">
            Fjorr — Short films of the world&apos;s greatest stories
          </h1>
          {searchReady ? (
            <SearchExperience
              browseContent={children}
              theaterOpen={theaterOpen}
            />
          ) : (
            <>
              <div className="w-full pt-4 pb-4 px-[10%] flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setSearchReady(true)}
                  onFocus={() => setSearchReady(true)}
                  className="w-full max-w-sm h-11 rounded-[10px] bg-page-chip text-page-faint font-sans text-sm font-medium text-left px-4 border-0 cursor-text"
                >
                  Search
                </button>
              </div>
              <div className="relative z-0 w-full">{children}</div>
            </>
          )}
        </div>
      </MinimalFilterProvider>
    </Suspense>
  );
}
