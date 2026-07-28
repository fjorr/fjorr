'use client';

import React from 'react';
import MixHeroTitle from '@/components/MixHeroTitle';
import { useMinimalFilter } from '@/components/MinimalFilterContext';
import { useDisplayMode } from '@/components/DisplayModeProvider';

/**
 * Single mix title band for home browse — same Y across Cine / Mini / Time.
 */
export default function HomeMixHero() {
  const { mix } = useMinimalFilter();
  const { isMinimal, isTimeline } = useDisplayMode();

  if (mix === 'all') return null;

  if (isMinimal) {
    return (
      <div className="w-full mt-6 md:mt-8 mb-5 md:mb-6">
        <div className="w-full max-w-[600px] mx-auto px-5">
          <MixHeroTitle />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-5 sm:px-8 md:px-16 mt-6 md:mt-8 mb-5 md:mb-6">
      <div
        className={`w-full max-w-[1440px] mx-auto ${
          isTimeline ? 'text-center' : ''
        }`}
      >
        <MixHeroTitle />
      </div>
    </div>
  );
}
