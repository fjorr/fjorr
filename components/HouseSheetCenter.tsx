'use client';

import React, { type ReactNode } from 'react';

/**
 * Short house sheets — top-aligned under the wordmark.
 * Lives inside HOUSE_CHROME_COLUMN so left edge matches the mark.
 * 60px gap from the nav edge to the menu title.
 */
export default function HouseSheetCenter({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`h-full overflow-y-auto pt-[60px] pb-10 text-left md:pb-14 ${className}`}
    >
      {children}
    </div>
  );
}

/** Shared sheet title — large, under the wordmark. */
export const HOUSE_SHEET_TITLE =
  'm-0 font-sans text-[60px] font-bold leading-none tracking-tight text-[#0B0B0C]';
