'use client';

import React, { useLayoutEffect, useRef } from 'react';
import type { MuxStoryboard } from '@/lib/theater/use-mux-storyboard';

type Props = {
  storyboard: MuxStoryboard;
  /** Moving rail — transform updated from paintProgress via ref. */
  railRef: React.RefObject<HTMLDivElement | null>;
  /** Written once tiles mount so paintProgress can pan without React. */
  metaRef: React.MutableRefObject<FilmStripMeta | null>;
  scrubberRef: React.RefObject<HTMLInputElement | null>;
  elapsedRef: React.RefObject<HTMLSpanElement | null>;
  isScrubbing: boolean;
  isLight?: boolean;
  onScrubStart: () => void;
  onScrubChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onScrubEnd: (e: React.SyntheticEvent<HTMLInputElement>) => void;
};

export type FilmStripMeta = {
  /** Distance between tile left edges (display px). */
  pitch: number;
  tileW: number;
  tileH: number;
  count: number;
  viewportW: number;
};

const DISPLAY_H = 80;
const GAP = 2;

/**
 * Full-bleed Mux storyboard thumbnails — pans under a fixed center gate while scrubbing.
 */
export default function TheaterFilmStrip({
  storyboard,
  railRef,
  metaRef,
  scrubberRef,
  elapsedRef,
  isScrubbing,
  isLight = false,
  onScrubStart,
  onScrubChange,
  onScrubEnd,
}: Props) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const scale = DISPLAY_H / storyboard.tileHeight;
  const tileW = Math.round(storyboard.tileWidth * scale);
  const tileH = DISPLAY_H;
  const pitch = tileW + GAP;

  useLayoutEffect(() => {
    const measure = () => {
      const vw = viewportRef.current?.clientWidth || 0;
      metaRef.current = {
        pitch,
        tileW,
        tileH,
        count: storyboard.tiles.length,
        viewportW: vw,
      };
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [metaRef, pitch, tileW, tileH, storyboard.tiles.length]);

  return (
    <div
      data-ui-control="true"
      className="relative w-screen max-w-[100vw] left-1/2 -translate-x-1/2 select-none"
    >
      <div className="flex justify-center mb-2.5 px-4">
        <span
          ref={elapsedRef}
          className={`font-mono text-[12px] font-medium tabular-nums tracking-normal leading-none transition-colors duration-150 ${
            isScrubbing ? 'text-[#d90429]' : isLight ? 'text-[#0B0B0C]/55' : 'text-[#F5F5F7]/55'
          }`}
        >
          00:00
        </span>
      </div>

      <div
        ref={viewportRef}
        className="relative overflow-hidden"
        style={{ height: tileH }}
      >
        <div
          ref={railRef}
          className="absolute top-0 left-0 flex items-center will-change-transform"
          style={{
            transform: 'translate3d(0, 0, 0)',
            gap: GAP,
            height: tileH,
          }}
        >
          {storyboard.tiles.map((tile, i) => (
            <div
              key={`${tile.start}-${i}`}
              className="shrink-0 bg-black overflow-hidden"
              style={{
                width: tileW,
                height: tileH,
                backgroundImage: `url(${storyboard.url})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: `${storyboard.sheetWidth * scale}px ${storyboard.sheetHeight * scale}px`,
                backgroundPosition: `-${tile.x * scale}px -${tile.y * scale}px`,
              }}
              aria-hidden
            />
          ))}
        </div>

        {/* Fixed center gate */}
        <div
          className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 z-20 w-px bg-[#d90429]"
          aria-hidden
        />

        <input
          ref={scrubberRef}
          type="range"
          min={0}
          max={100}
          step="any"
          defaultValue={0}
          onMouseDown={onScrubStart}
          onTouchStart={onScrubStart}
          onChange={onScrubChange}
          onMouseUp={onScrubEnd}
          onTouchEnd={onScrubEnd}
          aria-label="Seek"
          className="absolute inset-0 w-full h-full m-0 appearance-none bg-transparent cursor-ew-resize outline-none z-30 touch-none focus:outline-none focus:ring-0 [&::-webkit-slider-runnable-track]:h-full [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-full [&::-webkit-slider-thumb]:bg-transparent [&::-moz-range-track]:h-full [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-8 [&::-moz-range-thumb]:h-full [&::-moz-range-thumb]:bg-transparent [&::-moz-range-thumb]:border-0"
          style={{ WebkitAppearance: 'none' }}
        />
      </div>
    </div>
  );
}

/** Pan rail so the frame at `ratio` sits under the center gate. */
export function paintFilmStrip(
  rail: HTMLDivElement | null,
  meta: FilmStripMeta | null,
  ratio: number
) {
  if (!rail || !meta || meta.count < 1 || meta.viewportW < 1) return;
  const r = Math.min(1, Math.max(0, ratio));
  const idx = r * Math.max(0, meta.count - 1);
  const frameCenter = idx * meta.pitch + meta.tileW / 2;
  const x = meta.viewportW / 2 - frameCenter;
  rail.style.transform = `translate3d(${x}px, 0, 0)`;
}
