'use client';

import React from 'react';
import HouseFooter from '@/components/house/HouseFooter';
import { useHouseOverlay } from '@/components/HouseOverlayProvider';

/**
 * House footer for scroll pages (e.g. join, about, contact).
 * - Default: in document flow — long pages push it below the fold.
 * - Sheet open (except search): pins to the viewport bottom so controls stay above the overlay.
 * - Search: footer stays in document flow / inside the sheet scroll (below the fold).
 * Hero home/film keep their own framed HouseFooter inside the fixed shell.
 * Subscribe → /subscribe (email + RSS), not an overlay sheet.
 */
export default function HouseScrollFooter({
  variant = 'dark',
  surfaceClassName = 'bg-white',
}: {
  /** `light` = white type (dark pages like About). */
  variant?: 'light' | 'dark';
  surfaceClassName?: string;
}) {
  const { active, isOpen, toggle } = useHouseOverlay();
  const searchOpen = isOpen('search');
  // Search owns its own in-flow footer below results — don't pin over the sheet.
  const pinned = active != null && !searchOpen;
  const tone = pinned ? 'dark' : variant;
  const surface = pinned ? 'bg-white' : surfaceClassName;

  const footer = (
    <HouseFooter
      variant={tone}
      langOpen={isOpen('language')}
      shortcutsOpen={isOpen('shortcuts')}
      legalOpen={isOpen('legal')}
      onLanguage={() => toggle('language')}
      onShortcuts={() => toggle('shortcuts')}
      onLegal={() => toggle('legal')}
    />
  );

  return (
    <>
      {pinned ? (
        <div className="h-[54px] w-full shrink-0" aria-hidden />
      ) : null}
      <div
        className={
          pinned
            ? `fixed inset-x-0 bottom-0 z-[60] ${surface}`
            : `relative z-50 w-full ${surface}`
        }
      >
        {footer}
      </div>
    </>
  );
}
