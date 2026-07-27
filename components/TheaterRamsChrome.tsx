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
  logoLabel?: string;
  onLogoClick?: () => void;
  onScrubStart: () => void;
  onScrubChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onScrubEnd: (e: React.SyntheticEvent<HTMLInputElement>) => void;
};

/** Fixed track width — not coupled to the tools row below. Wider on mobile. */
const SCRUBBER_WIDTH = 'w-[min(84vw,340px)] sm:w-[min(72vw,300px)]';

/**
 * Rams glass chassis — floats over the bottom of the player.
 * Frosted glass pill; title + meta above tick track; tools row sized independently.
 * Mobile-first: larger type and ~44px scrubber hit area.
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
  logoLabel,
  onLogoClick,
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
      className="w-fit max-w-[min(94vw,480px)] rounded-[14px] sm:rounded-[12px] bg-black/50 backdrop-blur-xl px-5 py-3.5 sm:px-5 sm:py-3 flex flex-col items-center gap-3 sm:gap-2.5 select-none text-[#F5F5F7]"
    >
      {captionsSlot ? (
        <div className={`${SCRUBBER_WIDTH} text-center`}>
          {captionsSlot}
        </div>
      ) : null}

      {filmTitle ? (
        <div className={`flex flex-col items-center gap-1.5 sm:gap-1.5 ${SCRUBBER_WIDTH}`}>
          <p className="font-sans text-[15px] sm:text-[13px] font-medium tracking-normal leading-none text-center truncate w-full">
            {filmTitle}
          </p>
          {filmMeta ? (
            <p
              className={`font-sans text-[12px] sm:text-[11px] font-normal tracking-normal leading-none text-center truncate w-full ${muted}`}
            >
              {filmMeta}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Timeline — tall hit area on mobile; ticks stay visually thin */}
      <div className={`relative ${SCRUBBER_WIDTH} h-11 sm:h-7`}>
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 h-[9px] sm:h-[7px] -translate-y-1/2"
          style={{
            backgroundImage: `repeating-linear-gradient(
              to right,
              ${tickColor} 0,
              ${tickColor} 1px,
              transparent 1px,
              transparent 7px
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
              isScrubbing
                ? 'w-[10px] h-[10px] sm:w-[8px] sm:h-[8px]'
                : 'w-[9px] h-[9px] sm:w-[7px] sm:h-[7px]'
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
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-11 sm:h-7 m-0 appearance-none bg-transparent cursor-pointer outline-none z-30 touch-none focus:outline-none focus:ring-0 [&::-webkit-slider-runnable-track]:h-11 [&::-webkit-slider-runnable-track]:sm:h-7 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-11 [&::-webkit-slider-thumb]:sm:w-3 [&::-webkit-slider-thumb]:sm:h-7 [&::-webkit-slider-thumb]:bg-transparent [&::-moz-range-track]:h-11 [&::-moz-range-track]:sm:h-7 [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-11 [&::-moz-range-thumb]:sm:w-3 [&::-moz-range-thumb]:sm:h-7 [&::-moz-range-thumb]:bg-transparent [&::-moz-range-thumb]:border-0"
          style={{ WebkitAppearance: 'none' }}
        />
      </div>

      {/* Tools row — same width as scrubber: timecode left, controls right */}
      <div
        className={`min-h-[20px] h-[20px] sm:min-h-[14px] sm:h-[14px] flex items-center ${SCRUBBER_WIDTH} ${muted} ${
          hideElapsed ? 'justify-center' : 'justify-between gap-x-4'
        }`}
      >
        {!hideElapsed ? (
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {onLogoClick ? (
              <button
                type="button"
                onClick={onLogoClick}
                aria-label={logoLabel || 'Fjorr'}
                title={logoLabel}
                className="bg-transparent border-0 outline-none cursor-pointer p-0 opacity-80 hover:opacity-100 transition-opacity"
              >
                <svg
                  viewBox="0 0 143 81"
                  className="w-[28px] sm:w-[22px] h-auto"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden
                >
                  <path d="M71.3559 13.2942C60.8993 13.2942 52.4273 21.7814 52.4273 32.2448C52.4273 42.7082 60.9046 51.1953 71.3559 51.1953C81.8073 51.1953 90.2846 42.7082 90.2846 32.2448C90.2846 21.7814 81.8073 13.2942 71.3559 13.2942ZM71.3559 39.7278C67.232 39.7278 63.8869 36.3789 63.8869 32.2501C63.8869 28.1214 67.232 24.7725 71.3559 24.7725C75.4799 24.7725 78.825 28.1214 78.825 32.2501C78.825 36.3789 75.4799 39.7278 71.3559 39.7278Z" />
                  <path d="M35.9047 15.0355C35.4032 15.0355 34.9978 15.4414 34.9978 15.9435V60.9377C34.9978 65.4136 31.5887 69.0883 27.23 69.505C26.7605 69.5477 26.403 69.9322 26.403 70.4023V80.0912C26.403 80.6146 26.8405 81.0206 27.3633 80.9992C37.996 80.4971 46.4627 71.7109 46.4627 60.9377V15.9435C46.4627 15.4414 46.0573 15.0355 45.5558 15.0355H35.9047Z" />
                  <path d="M0 0.908003V48.498C0 49.0001 0.405462 49.406 0.906954 49.406H11.9931C12.4946 49.406 12.9001 49.0001 12.9001 48.498V35.1397C12.9001 34.6376 13.3055 34.2317 13.807 34.2317H26.0616C26.5631 34.2317 26.9685 33.8258 26.9685 33.3237V23.6615C26.9685 23.1594 26.5631 22.7535 26.0616 22.7535H13.807C13.3055 22.7535 12.9001 22.3476 12.9001 21.8455V12.3755C12.9001 11.8735 13.3055 11.4675 13.807 11.4675H27.4967C27.9982 11.4675 28.4037 11.0616 28.4037 10.5595V0.908003C28.4037 0.405931 27.9982 0 27.4967 0H0.906954C0.405462 0 0 0.405931 0 0.908003Z" />
                  <path d="M116.309 15.9435V22.7375C116.309 23.2395 115.402 23.6455 115.402 23.6455H108.509C108.066 23.6455 107.709 24.0033 107.709 24.4466V48.5568C107.709 49.0589 107.303 49.4648 106.802 49.4648H97.1508C96.6493 49.4648 96.2438 49.0589 96.2438 48.5568V15.9435C96.2438 15.4414 96.6493 15.0355 97.1508 15.0355H115.402C115.903 15.0355 116.309 15.4414 116.309 15.9435Z" />
                  <path d="M143 15.9435V22.7375C143 23.2395 142.595 23.6455 142.093 23.6455H135.2C134.757 23.6455 134.4 24.0033 134.4 24.4466V48.5568C134.4 49.0589 133.994 49.4648 133.493 49.4648H123.842C123.34 49.4648 122.935 49.0589 122.935 48.5568V15.9435C122.935 15.4414 123.34 15.0355 123.842 15.0355H142.093C142.595 15.0355 143 15.4414 143 15.9435Z" />
                </svg>
              </button>
            ) : null}
            <span
              ref={elapsedRef}
              className="font-mono text-[13px] sm:text-[11px] font-normal tabular-nums tracking-normal leading-none"
            >
              00:00
            </span>
          </div>
        ) : null}
        <div
          className={`flex items-center min-w-0 ${
            hideElapsed ? 'w-full justify-center' : 'justify-end gap-x-4 sm:gap-x-3'
          }`}
        >
          {toolsSlot}
        </div>
      </div>
    </div>
  );
}
