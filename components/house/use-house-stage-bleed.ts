'use client';

import { useEffect, useState } from 'react';

/** Desktop slide distance. Phones keep 24 so the frame cannot widen the page. */
const DESKTOP_BLEED_PX = 72;

function bleedForWidth(width: number): number {
  return width < 768 ? 24 : DESKTOP_BLEED_PX;
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
