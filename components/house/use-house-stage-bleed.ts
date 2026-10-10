'use client';

import { useEffect, useState } from 'react';
import { houseStageSidePx } from '@/components/house/house-stage-margins';

/** Desktop slide distance. Mobile matches the stage inset so the frame cannot widen the phone. */
const DESKTOP_BLEED_PX = 72;

function bleedForWidth(width: number): number {
  return houseStageSidePx(width) === 24 ? 24 : DESKTOP_BLEED_PX;
}

export function useHouseStageBleed(): number {
  // 24 on the server and the first client render, so a phone never paints the wide frame.
  const [bleed, setBleed] = useState(24);

  useEffect(() => {
    const apply = () => setBleed(bleedForWidth(window.innerWidth));
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);

  return bleed;
}
