'use client';

import React, {
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

/**
 * Soft Apple-style rise for sheet / page content.
 * Starts after mount so SSR / soft-nav pages actually show the entrance
 * (CSS animation on SSR HTML finishes before paint).
 */
export default function SheetEnter({
  delay = 0,
  className = '',
  children,
}: {
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  const [play, setPlay] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setPlay(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={`${
        play ? 'house-sheet-in' : 'opacity-0'
      } will-change-[transform,opacity] ${className}`}
      style={
        play
          ? ({ animationDelay: `${delay}ms` } as CSSProperties)
          : undefined
      }
    >
      {children}
    </div>
  );
}
