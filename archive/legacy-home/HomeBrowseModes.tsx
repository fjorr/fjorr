'use client';

import React, { type ReactNode } from 'react';
import { useDisplayMode } from '@/components/DisplayModeProvider';

/**
 * Shows the active browse mode tree from the server (cookie-gated).
 * After a mode switch + refresh, the matching tree streams in.
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

  return (
    <>
      <div
        className={mode === 'cinematic' ? 'relative z-0 w-full' : 'hidden'}
        aria-hidden={mode !== 'cinematic'}
      >
        {cinematic ?? (mode === 'cinematic' ? <ModeSwitchFallback /> : null)}
      </div>
      <div
        className={mode === 'minimal' ? 'relative z-0 w-full' : 'hidden'}
        aria-hidden={mode !== 'minimal'}
      >
        {minimal ?? (mode === 'minimal' ? <ModeSwitchFallback /> : null)}
      </div>
      <div
        className={mode === 'timeline' ? 'relative z-0 w-full' : 'hidden'}
        aria-hidden={mode !== 'timeline'}
      >
        {timeline ?? (mode === 'timeline' ? <ModeSwitchFallback /> : null)}
      </div>
    </>
  );
}

function ModeSwitchFallback() {
  return (
    <div className="w-full px-[10%] py-16 flex justify-center" aria-hidden>
      <div className="w-full max-w-sm h-24 rounded-[10px] bg-page-chip animate-pulse" />
    </div>
  );
}
