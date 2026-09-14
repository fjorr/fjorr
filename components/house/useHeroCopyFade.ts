'use client';

import { useEffect, useState } from 'react';

/**
 * Keep hero copy parked while posters slide.
 * Fade out on leave; swap + fade in once the incoming poster has mostly arrived.
 */
export function useHeroCopyFade(phase: 'idle' | 'from' | 'to', index: number) {
  const [displayIndex, setDisplayIndex] = useState(index);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (phase === 'from') {
      setVisible(false);
      return;
    }
    if (phase === 'to') {
      const id = window.setTimeout(() => {
        setDisplayIndex(index);
        setVisible(true);
      }, 420);
      return () => window.clearTimeout(id);
    }
    setDisplayIndex(index);
    setVisible(true);
  }, [phase, index]);

  return { displayIndex, visible };
}
