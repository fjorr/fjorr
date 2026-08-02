'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from '@/i18n/navigation';

/**
 * ← / → keys and horizontal swipe between Manual entries.
 * Visible controls live in the Manual footer.
 */
export default function ManualPager({
  prevHref,
  nextHref,
  children,
}: {
  prevHref: string | null;
  nextHref: string | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === 'INPUT' ||
          t.tagName === 'TEXTAREA' ||
          t.tagName === 'SELECT' ||
          t.isContentEditable)
      ) {
        return;
      }
      if (e.key === 'ArrowLeft' && prevHref) {
        e.preventDefault();
        router.push(prevHref);
      } else if (e.key === 'ArrowRight' && nextHref) {
        e.preventDefault();
        router.push(nextHref);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prevHref, nextHref, router]);

  return (
    <div
      className="w-full"
      onTouchStart={(e) => {
        const touch = e.changedTouches[0];
        if (!touch) return;
        touchStart.current = { x: touch.clientX, y: touch.clientY };
      }}
      onTouchEnd={(e) => {
        const start = touchStart.current;
        touchStart.current = null;
        const touch = e.changedTouches[0];
        if (!start || !touch) return;
        const dx = touch.clientX - start.x;
        const dy = touch.clientY - start.y;
        if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
        if (dx > 0 && prevHref) router.push(prevHref);
        else if (dx < 0 && nextHref) router.push(nextHref);
      }}
    >
      {children}
    </div>
  );
}
