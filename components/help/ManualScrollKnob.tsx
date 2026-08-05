'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

const THUMB_MIN = 48;

/**
 * Chrome divider that becomes a horizontal scrub when the Manual body overflows.
 * Quiet 1px rule when content fits; ink thumb on the same line when it doesn’t.
 */
export default function ManualScrollKnob({
  scrollRef,
  label,
}: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  label: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [overflowing, setOverflowing] = useState(false);
  const [ratio, setRatio] = useState(0);
  const [thumbLeft, setThumbLeft] = useState(0);
  const [thumbWidth, setThumbWidth] = useState(THUMB_MIN);

  const sync = useCallback(() => {
    const el = scrollRef.current;
    const track = trackRef.current;
    if (!el || !track) return;
    const max = el.scrollHeight - el.clientHeight;
    const overflow = max > 2;
    setOverflowing(overflow);
    if (!overflow) {
      setRatio(0);
      return;
    }
    const trackW = track.clientWidth;
    const nextThumb = Math.min(
      trackW,
      Math.max(THUMB_MIN, (el.clientHeight / el.scrollHeight) * trackW)
    );
    const travel = Math.max(0, trackW - nextThumb);
    const nextRatio = Math.min(1, Math.max(0, el.scrollTop / max));
    setRatio(nextRatio);
    setThumbWidth(nextThumb);
    setThumbLeft(nextRatio * travel);
  }, [scrollRef]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    sync();
    el.addEventListener('scroll', sync, { passive: true });
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    const track = trackRef.current;
    if (track) ro.observe(track);
    return () => {
      el.removeEventListener('scroll', sync);
      ro.disconnect();
    };
  }, [scrollRef, sync]);

  const scrollToRatio = useCallback(
    (next: number) => {
      const el = scrollRef.current;
      if (!el) return;
      const max = el.scrollHeight - el.clientHeight;
      if (max <= 0) return;
      el.scrollTop = Math.min(1, Math.max(0, next)) * max;
    },
    [scrollRef]
  );

  const ratioFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return 0;
      const rect = track.getBoundingClientRect();
      const usable = Math.max(1, rect.width - thumbWidth);
      const x = clientX - rect.left - thumbWidth / 2;
      return Math.min(1, Math.max(0, x / usable));
    },
    [thumbWidth]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (!overflowing) return;
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    scrollToRatio(ratioFromClientX(e.clientX));
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    e.preventDefault();
    scrollToRatio(ratioFromClientX(e.clientX));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    dragging.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  return (
    <div
      ref={trackRef}
      role={overflowing ? 'slider' : undefined}
      aria-label={overflowing ? label : undefined}
      aria-orientation={overflowing ? 'horizontal' : undefined}
      aria-valuemin={overflowing ? 0 : undefined}
      aria-valuemax={overflowing ? 100 : undefined}
      aria-valuenow={overflowing ? Math.round(ratio * 100) : undefined}
      tabIndex={overflowing ? 0 : undefined}
      className={`manual-doc-rule absolute left-10 right-10 sm:left-11 sm:right-11 bottom-0 h-3 -mb-1 flex items-center touch-none select-none ${
        overflowing ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'
      }`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={
        overflowing
          ? (e) => {
              const step = e.shiftKey ? 0.2 : 0.08;
              if (e.key === 'ArrowRight' || e.key === 'PageDown') {
                e.preventDefault();
                scrollToRatio(ratio + step);
              } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                e.preventDefault();
                scrollToRatio(ratio - step);
              } else if (e.key === 'Home') {
                e.preventDefault();
                scrollToRatio(0);
              } else if (e.key === 'End') {
                e.preventDefault();
                scrollToRatio(1);
              }
            }
          : undefined
      }
    >
      {/* Base divider — always present */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[color-mix(in_srgb,var(--page-fg)_12%,transparent)]"
      />
      {/* Thumb — only when scrolling is needed */}
      {overflowing ? (
        <div
          aria-hidden
          className="absolute top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-[color-mix(in_srgb,var(--page-fg)_55%,transparent)]"
          style={{ left: thumbLeft, width: thumbWidth }}
        />
      ) : null}
    </div>
  );
}
