'use client';

import React, { useEffect, useState, type ReactNode } from 'react';
import { useDisplayMode } from '@/components/DisplayModeProvider';
import type { DisplayMode } from '@/lib/display-mode';

/**
 * Keeps visited browse modes mounted and toggles visibility.
 * Mode switches stay client-side. Mini/Time mount on first visit only.
 */
export default function HomeBrowseModes({
  cinematic,
  minimal,
  timeline,
}: {
  cinematic: ReactNode;
  minimal: ReactNode;
  timeline: ReactNode;
}) {
  const { mode } = useDisplayMode();
  const [mounted, setMounted] = useState(() => new Set<DisplayMode>([mode]));

  useEffect(() => {
    setMounted((prev) => {
      if (prev.has(mode)) return prev;
      const next = new Set(prev);
      next.add(mode);
      return next;
    });
  }, [mode]);

  return (
    <>
      <div
        className={mode === 'cinematic' ? 'relative z-0 w-full' : 'hidden'}
        aria-hidden={mode !== 'cinematic'}
      >
        {mounted.has('cinematic') ? cinematic : null}
      </div>
      <div
        className={mode === 'minimal' ? 'relative z-0 w-full' : 'hidden'}
        aria-hidden={mode !== 'minimal'}
      >
        {mounted.has('minimal') ? minimal : null}
      </div>
      <div
        className={mode === 'timeline' ? 'relative z-0 w-full' : 'hidden'}
        aria-hidden={mode !== 'timeline'}
      >
        {mounted.has('timeline') ? timeline : null}
      </div>
    </>
  );
}
