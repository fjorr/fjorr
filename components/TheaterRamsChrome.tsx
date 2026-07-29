'use client';

import React from 'react';

type IdentityProps = {
  isLight?: boolean;
  filmTitle?: string;
  filmMeta?: string;
  /** Quiet credit, e.g. Viewer #12 — only when earned. */
  filmCredit?: string;
  logoLabel?: string;
  onLogoClick?: () => void;
  className?: string;
};

/** Logo + title + subhead — used above plaque media. */
export function TheaterRamsIdentity({
  isLight = false,
  filmTitle,
  filmMeta,
  filmCredit,
  logoLabel,
  onLogoClick,
  className = '',
}: IdentityProps) {
  const muted = isLight ? 'text-[#0B0B0C]/55' : 'text-[#F5F5F7]/55';
  const ink = isLight ? 'text-[#0B0B0C]' : 'text-[#F5F5F7]';

  return (
    <div
      data-ui-control="true"
      className={`pointer-events-auto flex flex-col items-center gap-3 w-[min(84vw,320px)] select-none ${ink} ${className}`}
    >
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
            className="w-[28px] h-auto"
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

      {filmTitle ? (
        <div className="flex flex-col items-center gap-2 w-full">
          <p className="font-sans text-[15px] font-medium tracking-normal leading-snug text-center truncate w-full">
            {filmTitle}
          </p>
          {filmMeta ? (
            <p
              className={`font-sans text-[12px] font-normal tracking-normal leading-snug text-center truncate w-full ${muted}`}
            >
              {filmMeta}
            </p>
          ) : null}
          {filmCredit ? (
            <p
              className={`font-mono text-[11px] font-medium tracking-normal leading-snug text-center truncate w-full ${muted}`}
            >
              {filmCredit}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

type Props = {
  scrubberRef: React.RefObject<HTMLInputElement | null>;
  playheadRef: React.RefObject<HTMLDivElement | null>;
  elapsedRef: React.RefObject<HTMLSpanElement | null>;
  durationRef: React.RefObject<HTMLSpanElement | null>;
  isScrubbing: boolean;
  isLight?: boolean;
  filmTitle?: string;
  filmMeta?: string;
  filmCredit?: string;
  toolsSlot?: React.ReactNode;
  logoLabel?: string;
  onLogoClick?: () => void;
  onScrubStart: () => void;
  onScrubChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onScrubEnd: (e: React.SyntheticEvent<HTMLInputElement>) => void;
  /** When true, omit logo/title (rendered above plaque instead). */
  hideHeader?: boolean;
};

/** Matches plaque video width so scrubber aligns with the frame. */
export const PLAQUE_WIDTH =
  'w-[min(72vw,300px)] sm:w-[min(58vw,420px)] lg:w-[min(48vw,560px)] xl:w-[min(42vw,640px)]';

const CHROME_WIDTH = PLAQUE_WIDTH;

/** Scrubber thumb/track reset — module-level so it isn't rebuilt every render. */
const RAMS_SCRUB_STYLE = `
  .fjorr-rams-scrub::-webkit-slider-thumb{
    -webkit-appearance:none!important;
    appearance:none!important;
    width:28px!important;
    height:44px!important;
    background:transparent!important;
    border:0!important;
    border-radius:0!important;
    box-shadow:none!important;
    opacity:0!important;
  }
  .fjorr-rams-scrub::-moz-range-thumb{
    appearance:none!important;
    width:28px!important;
    height:44px!important;
    background:transparent!important;
    border:0!important;
    border-radius:0!important;
    box-shadow:none!important;
    opacity:0!important;
  }
  .fjorr-rams-scrub::-webkit-slider-runnable-track,
  .fjorr-rams-scrub::-moz-range-track{
    background:transparent!important;
    border:0!important;
  }
`;

/**
 * Museum plaque chrome — no glass.
 * Logo → title → thin scrubber → centered tools.
 */
export default function TheaterRamsChrome({
  scrubberRef,
  playheadRef,
  elapsedRef,
  durationRef,
  isScrubbing,
  isLight = false,
  filmTitle,
  filmMeta,
  filmCredit,
  toolsSlot,
  logoLabel,
  onLogoClick,
  onScrubStart,
  onScrubChange,
  onScrubEnd,
  hideHeader = false,
}: Props) {
  const muted = isLight ? 'text-[#0B0B0C]/55' : 'text-[#F5F5F7]/55';
  const ink = isLight ? 'text-[#0B0B0C]' : 'text-[#F5F5F7]';
  const hatch = isLight ? '#0B0B0C' : '#F5F5F7';
  const clockClass =
    'font-mono text-[12px] font-medium tabular-nums tracking-normal leading-none shrink-0 min-w-[3.25em] transition-colors duration-150';
  const clockTone = isScrubbing ? ink : muted;

  return (
    <div
      data-ui-control="true"
      className={`pointer-events-auto flex flex-col items-center gap-5 select-none ${ink} ${CHROME_WIDTH}`}
    >
      {!hideHeader ? (
        <TheaterRamsIdentity
          isLight={isLight}
          filmTitle={filmTitle}
          filmMeta={filmMeta}
          filmCredit={filmCredit}
          logoLabel={logoLabel}
          onLogoClick={onLogoClick}
          className="!w-full"
        />
      ) : null}

      <div className="w-full flex items-center gap-2.5">
        <style dangerouslySetInnerHTML={{ __html: RAMS_SCRUB_STYLE }} />
        <span ref={elapsedRef} className={`${clockClass} text-left ${clockTone}`} />
        <div className="relative min-w-0 flex-1 h-11">
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 h-[8px] -translate-y-1/2 rounded-full overflow-hidden opacity-55"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  -45deg,
                  transparent 0 1px,
                  ${hatch} 1px 2px
                ),
                repeating-linear-gradient(
                  45deg,
                  transparent 0 1px,
                  ${hatch} 1px 2px
                )
              `,
            }}
            aria-hidden
          />
          <div
            ref={playheadRef}
            className="pointer-events-none absolute z-20 top-1/2 -translate-x-1/2 -translate-y-1/2"
            aria-hidden
          >
            <div
              className={`rounded-full transition-[width,height] duration-100 ${
                isLight ? 'bg-[#0B0B0C]' : 'bg-[#F5F5F7]'
              } ${isScrubbing ? 'w-[13px] h-[13px]' : 'w-[12px] h-[12px]'}`}
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
            className="fjorr-rams-scrub absolute inset-0 w-full h-full m-0 appearance-none bg-transparent cursor-pointer outline-none z-30 touch-none focus:outline-none focus:ring-0"
            style={{ WebkitAppearance: 'none', appearance: 'none', background: 'transparent' }}
          />
        </div>
        <span ref={durationRef} className={`${clockClass} text-right ${clockTone}`} />
      </div>

      <div className={`min-h-[18px] h-[18px] flex items-center justify-center w-full ${muted}`}>
        <div className="flex items-center justify-center flex-nowrap min-w-0 gap-x-2 min-[400px]:gap-x-3.5">
          {toolsSlot}
        </div>
      </div>
    </div>
  );
}
