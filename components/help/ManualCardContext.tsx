'use client';

import React, { createContext, useContext } from 'react';
import type { ManualEntry } from '@/lib/help/content';

type ManualCardContextValue = {
  /** In-card Manual navigation — keeps the shell mounted. */
  onNavigateEntry?: (slug: string) => void;
  /** Open a plate full-bleed in the card. */
  onOpenPlate?: (index: number) => void;
  /** Prev / next in menu order — shown beside the CTA. */
  pager?: { prev: ManualEntry | null; next: ManualEntry | null };
};

const ManualCardContext = createContext<ManualCardContextValue>({});

export function ManualCardProvider({
  value,
  children,
}: {
  value: ManualCardContextValue;
  children: React.ReactNode;
}) {
  return (
    <ManualCardContext.Provider value={value}>
      {children}
    </ManualCardContext.Provider>
  );
}

export function useManualCard() {
  return useContext(ManualCardContext);
}
