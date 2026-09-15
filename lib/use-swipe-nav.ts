'use client';

import {
  useCallback,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';

type Options = {
  onPrev: () => void;
  onNext: () => void;
  /** When false, handlers no-op. */
  enabled?: boolean;
  /** Min horizontal travel (px) to count as a swipe. */
  threshold?: number;
};

/**
 * Horizontal swipe → prev/next (mobile carousels with arrow chrome).
 * Axis-locks so vertical scrolls aren't stolen.
 * Suppresses the click that follows a successful swipe (so poster taps don't fire).
 */
export function useSwipeNav({
  onPrev,
  onNext,
  enabled = true,
  threshold = 48,
}: Options) {
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const axisRef = useRef<'h' | 'v' | null>(null);
  const swipedRef = useRef(false);
  const onPrevRef = useRef(onPrev);
  const onNextRef = useRef(onNext);
  onPrevRef.current = onPrev;
  onNextRef.current = onNext;

  const reset = useCallback(() => {
    startRef.current = null;
    axisRef.current = null;
  }, []);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent) => {
      if (!enabled) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      swipedRef.current = false;
      startRef.current = { x: event.clientX, y: event.clientY };
      axisRef.current = null;
    },
    [enabled]
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent) => {
      if (!enabled || !startRef.current || axisRef.current) return;
      const dx = event.clientX - startRef.current.x;
      const dy = event.clientY - startRef.current.y;
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      axisRef.current = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v';
    },
    [enabled]
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent) => {
      if (!enabled || !startRef.current) {
        reset();
        return;
      }
      const dx = event.clientX - startRef.current.x;
      const dy = event.clientY - startRef.current.y;
      const axis = axisRef.current;
      reset();
      if (axis === 'v') return;
      if (axis !== 'h' && Math.abs(dx) <= Math.abs(dy)) return;
      if (Math.abs(dx) < threshold) return;
      swipedRef.current = true;
      // Swipe left → next; swipe right → previous (native carousel feel).
      if (dx < 0) onNextRef.current();
      else onPrevRef.current();
    },
    [enabled, reset, threshold]
  );

  const onPointerCancel = useCallback(() => {
    reset();
  }, [reset]);

  const onClickCapture = useCallback((event: ReactMouseEvent) => {
    if (!swipedRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    swipedRef.current = false;
  }, []);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onClickCapture,
  };
}
