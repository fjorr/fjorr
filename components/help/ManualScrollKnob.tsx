'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

const KNOB = 12;
const EDGE_PAD = 8;

/**
 * Red circle on the card’s right edge — drag (or click the rail) to scroll
 * when the Manual body overflows.
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
  const [visible, setVisible] = useState(false);
  const [ratio, setRatio] = useState(0);
  const [knobTop, setKnobTop] = useState(EDGE_PAD);

  const sync = useCallback(() => {
    const el = scrollRef.current;
    const track = trackRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    const overflow = max > 2;
    const nextRatio = overflow ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0;
    setVisible(overflow);
    setRatio(nextRatio);
    if (track) {
      const travel = Math.max(0, track.clientHeight - KNOB - EDGE_PAD * 2);
      setKnobTop(EDGE_PAD + nextRatio * travel);
    }
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
      const clamped = Math.min(1, Math.max(0, next));
      el.scrollTop = clamped * max;
      setRatio(clamped);
      const track = trackRef.current;
      if (track) {
        const travel = Math.max(0, track.clientHeight - KNOB - EDGE_PAD * 2);
        setKnobTop(EDGE_PAD + clamped * travel);
      }
    },
    [scrollRef]
  );

  const ratioFromClientY = useCallback((clientY: number) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const travel = Math.max(1, rect.height - KNOB - EDGE_PAD * 2);
    const y = clientY - rect.top - EDGE_PAD - KNOB / 2;
    return Math.min(1, Math.max(0, y / travel));
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    scrollToRatio(ratioFromClientY(e.clientY));
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    e.preventDefault();
    scrollToRatio(ratioFromClientY(e.clientY));
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
      className={`absolute top-0 bottom-0 right-0 z-20 w-5 touch-none select-none ${
        visible ? 'pointer-events-auto' : 'pointer-events-none opacity-0'
      }`}
      onPointerDown={visible ? onPointerDown : undefined}
      onPointerMove={visible ? onPointerMove : undefined}
      onPointerUp={visible ? onPointerUp : undefined}
      onPointerCancel={visible ? onPointerUp : undefined}
    >
      {visible ? (
        <button
          type="button"
          aria-label={label}
          aria-orientation="vertical"
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(ratio * 100)}
          className="absolute right-0 size-3 rounded-full bg-[#E11D2E] border-0 p-0 cursor-grab active:cursor-grabbing shadow-[0_1px_2px_rgba(0,0,0,0.25)] translate-x-1/2 hover:scale-110 active:scale-105 transition-transform duration-75"
          style={{ top: knobTop, width: KNOB, height: KNOB }}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 0.2 : 0.08;
            if (e.key === 'ArrowDown' || e.key === 'PageDown') {
              e.preventDefault();
              scrollToRatio(ratio + step);
            } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
              e.preventDefault();
              scrollToRatio(ratio - step);
            } else if (e.key === 'Home') {
              e.preventDefault();
              scrollToRatio(0);
            } else if (e.key === 'End') {
              e.preventDefault();
              scrollToRatio(1);
            }
          }}
        />
      ) : null}
    </div>
  );
}
