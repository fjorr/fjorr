'use client';

import React from 'react';

type Props = {
  scrubberRef: React.RefObject<HTMLInputElement | null>;
  playheadRef: React.RefObject<HTMLDivElement | null>;
  scrubTimeRef: React.RefObject<HTMLSpanElement | null>;
  isScrubbing: boolean;
  isLight?: boolean;
  onScrubStart: () => void;
  onScrubChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onScrubEnd: (e: React.SyntheticEvent<HTMLInputElement>) => void;
};

/** Shared vertical anchor — track, bead, and hit area align here. */
const TRACK_CLASS = 'top-1/2 -translate-y-1/2';

/**
 * SAVED classic chrome — horizontal hairline + yellow bead.
 * Restore via `THEATER_PLAYER_CHROME = 'classic'` in player-chrome-variant.ts.
 */
export default function TheaterScrubberClassic({
  scrubberRef,
  playheadRef,
  scrubTimeRef,
  isScrubbing,
  isLight = false,
  onScrubStart,
  onScrubChange,
  onScrubEnd,
}: Props) {
  return (
    <div className="w-full max-w-[420px] mx-auto mt-2 px-1">
      <div className="relative h-14 select-none overflow-visible">
        <div
          className={`absolute inset-x-0 ${TRACK_CLASS} h-px pointer-events-none ${
            isLight ? 'bg-black/20' : 'bg-white/25'
          }`}
          aria-hidden
        />

        <div
          ref={playheadRef}
          className={`absolute ${TRACK_CLASS} z-20 pointer-events-none`}
          style={{ left: '0%' }}
        >
          <div className="relative -translate-x-1/2 -translate-y-1/2">
            <span
              ref={scrubTimeRef}
              className={`absolute left-1/2 bottom-full -translate-x-1/2 mb-2 whitespace-nowrap font-mono text-[11px] font-semibold tabular-nums tracking-tight text-[#ffd446] drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)] transition-opacity duration-150 ${
                isScrubbing ? 'opacity-100' : 'opacity-0'
              }`}
            >
              0:00
            </span>
            <div
              className={`rounded-full bg-[#ffd446] transition-transform duration-150 ${
                isScrubbing ? 'w-[7px] h-[7px] scale-110' : 'w-[5px] h-[5px]'
              }`}
              aria-hidden
            />
          </div>
        </div>

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
          className={`absolute inset-x-0 ${TRACK_CLASS} w-full h-11 m-0 appearance-none bg-transparent cursor-pointer outline-none z-30 focus:outline-none focus:ring-0 [&::-webkit-slider-runnable-track]:h-11 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-11 [&::-webkit-slider-thumb]:bg-transparent [&::-moz-range-track]:h-11 [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-11 [&::-moz-range-thumb]:bg-transparent [&::-moz-range-thumb]:border-0`}
          style={{ WebkitAppearance: 'none' }}
        />
      </div>
    </div>
  );
}
