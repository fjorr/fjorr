'use client';

import React, {
  Suspense,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { MinimalFilterProvider } from '@/components/MinimalFilterContext';
import SearchExperience from '@/components/SearchExperience';
import type { HomeMix } from '@/lib/home-mix';
import { preloadCinemaTheater } from '@/lib/cinema-theater';

/**
 * Home shell: search chrome + browse children stay mounted from first paint
 * so mobile doesn’t flash a Search stub then remount the hero controls.
 */
export default function HomeWithSearch({
  children,
  mixes = [],
}: {
  children: ReactNode;
  mixes?: HomeMix[];
}) {
  const [theaterOpen, setTheaterOpen] = useState(false);

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
          <SearchExperience
            browseContent={children}
            theaterOpen={theaterOpen}
          />
        </div>
      </MinimalFilterProvider>
    </Suspense>
  );
}
