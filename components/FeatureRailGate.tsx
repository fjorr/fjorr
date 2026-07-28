'use client';

import React, { type ReactNode } from 'react';
import { useMinimalFilter } from '@/components/MinimalFilterContext';

/** Hide feature rail / partner chrome while mixes, dials, or artifacts are active. */
export default function FeatureRailGate({ children }: { children: ReactNode }) {
  const { queryActive, contentType } = useMinimalFilter();
  if (queryActive || contentType === 'artifact') return null;
  return <>{children}</>;
}
