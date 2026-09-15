'use client';

import React, { type ReactNode } from 'react';
import { useDisplayMode } from '@/components/DisplayModeProvider';
import { useMinimalFilterOptional } from '@/components/MinimalFilterContext';

/**
 * Shows the Bureaux home promo when browse is idle.
 * Hidden while searching or when dials/mix filters are active.
 * Cine → full banner; Mini/Time → compact strip.
 */
export default function HomePromoGate({
  banner,
  compact,
}: {
  banner: ReactNode;
  compact: ReactNode;
}) {
  const { mode } = useDisplayMode();
  const filter = useMinimalFilterOptional();
  const busy =
    Boolean(filter?.searchActive) || Boolean(filter?.queryActive);

  if (busy) return null;

  // Match list shells: Mini `max-w-[600px]`, Time `max-w-sm` (TimelineRail).
  const isMinimal = mode === 'minimal';
  const isTimeline = mode === 'timeline';
  const matchList = isMinimal || isTimeline;

  return (
    <section
      className={
        matchList
          ? 'w-full mt-12 md:mt-16 mb-4 md:mb-8'
          : 'w-full px-8 md:px-16 mt-12 md:mt-16 mb-4 md:mb-8'
      }
    >
      <div
        className={
          isMinimal
            ? 'w-full max-w-[600px] mx-auto px-5'
            : isTimeline
              ? 'w-full max-w-sm mx-auto px-4 sm:px-5'
              : 'w-full max-w-[1440px] mx-auto'
        }
      >
        {mode === 'cinematic' ? banner : compact}
      </div>
    </section>
  );
}
