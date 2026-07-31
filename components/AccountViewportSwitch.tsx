'use client';

import React, { useEffect, useState } from 'react';

/**
 * Mount only mobile or desktop account ledger UI so posters/thumbs
 * aren't fetched twice (hidden CSS lists still load images).
 */
export default function AccountViewportSwitch({
  mobile,
  desktop,
}: {
  mobile: React.ReactNode;
  desktop: React.ReactNode;
}) {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // Prefer desktop markup for SSR / first paint; swap on mobile after measure.
  if (isDesktop === null || isDesktop) return <>{desktop}</>;
  return <>{mobile}</>;
}
