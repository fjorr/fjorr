'use client';

import { useEffect } from 'react';
import { useMinimalFilter } from '@/components/MinimalFilterContext';
import type { HomeMix } from '@/lib/home-mix';

/** Hydrates curated mixes into filter context after the home shell streams. */
export default function HomeMixesSetter({ mixes }: { mixes: HomeMix[] }) {
  const { setMixes } = useMinimalFilter();

  useEffect(() => {
    setMixes(mixes);
  }, [mixes, setMixes]);

  return null;
}
