'use client';

import React, { type ReactNode } from 'react';
import { useMinimalFilter } from '@/components/MinimalFilterContext';

/** Hide feature rail / partner chrome while mixes or dials are active. */
export default function FeatureRailGate({ children }: { children: ReactNode }) {
  const { queryActive } = useMinimalFilter();
  if (queryActive) return null;
  return <>{children}</>;
}
