'use client';

import React from 'react';

type Props = {
  scrubberRef: React.RefObject<HTMLInputElement | null>;
  playheadRef: React.RefObject<HTMLDivElement | null>;
  elapsedRef: React.RefObject<HTMLSpanElement | null>;
  isScrubbing: boolean;
  isLight?: boolean;
  filmTitle?: string;
  filmMeta?: string;
  captionsSlot?: React.ReactNode;
  toolsSlot?: React.ReactNode;
  /** Hide the clock while the tools row is swapped (e.g. caption picker). */
  hideElapsed?: boolean;
  onScrubStart: () => void;
  onScrubChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onScrubEnd: (e: React.SyntheticEvent<HTMLInputElement>) => void;
};

/**
 * Rams glass chassis — floats over the bottom of the player.
 * Frosted glass pill; title + meta centered above line; track same width as text row.
 */
export default function TheaterRamsChrome({
  scrubberRef,
  playheadRef,
  elapsedRef,
  isScrubbing,
  isLight = false,
  filmTitle,
  filmMeta,
  captionsSlot,
  toolsSlot,
  hideElapsed = false,
  onScrubStart,
  onScrubChange,
  onScrubEnd,
}: Props) {
  const muted = isLight ? 'text-[#0B0B0C]/50' : 'text-[#F5F5F7]/50';
  const tickColor = isLight
    ? 'color-mix(in srgb, #0B0B0C 35%, transparent)'
    : 'color-mix(in srgb, #F5F5F7 35%, transparent)';

  return (
    <div
      data-ui-control="true"
      className="w-fit max-w-[min(92vw,480px)] min-w-[280px] rounded-[12px] bg-black/50 backdrop-blur-xl px-5 py-3 flex flex-col items-center gap-2.5 select-none text-[#F5F5F7]"
    >
      {captionsSlot ? (
        <div className="w-full text-center">
          {captionsSlot}
        </div>
      ) : null}

      {filmTitle ? (
        <div className="flex flex-col items-center gap-1.5 w-full">
          <p className="font-sans text-[13px] font-medium tracking-normal leading-none text-center truncate w-full">
            {filmTitle}
          </p>
          {filmMeta ? (
            <p className={`font-sans text-[11px] font-normal tracking-normal leading-none text-center ${muted}`}>
              {filmMeta}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Timeline — tick marks instead of a solid hairline */}
      <div className="relative w-full h-6">
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 h-[7px] -translate-y-1/2"
          style={{
            backgroundImage: `repeating-linear-gradient(
              to right,
              ${tickColor} 0,
              ${tickColor} 1px,
              transparent 1px,
              transparent 6px
            )`,
          }}
          aria-hidden
        />
        <div
          ref={playheadRef}
          className="pointer-events-none absolute top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
          style={{ left: '0%' }}
          aria-hidden
        >
          <div
            className={`rounded-full bg-[#d90429] transition-transform duration-100 ${
              isScrubbing ? 'w-[6px] h-[6px]' : 'w-[5px] h-[5px]'
            }`}
          />
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
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-6 m-0 appearance-none bg-transparent cursor-pointer outline-none z-30 focus:outline-none focus:ring-0 [&::-webkit-slider-runnable-track]:h-6 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-transparent [&::-moz-range-track]:h-6 [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:bg-transparent [&::-moz-range-thumb]:border-0"
          style={{ WebkitAppearance: 'none' }}
        />
      </div>

      {/* Tools row: fixed height so caption picker swap doesn't shift layout */}
      <div className={`w-full min-h-[14px] h-[14px] flex items-center justify-center gap-x-3 ${muted}`}>
        {!hideElapsed ? (
          <span
            ref={elapsedRef}
            className="font-mono text-[11px] font-normal tabular-nums tracking-normal leading-none shrink-0"
          >
            00:00
          </span>
        ) : null}
        {toolsSlot}
      </div>
    </div>
  );
}
