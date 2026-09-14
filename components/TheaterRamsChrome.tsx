'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

type IdentityProps = {
  isLight?: boolean;
  filmTitle?: string;
  filmMeta?: string;
  filmCredit?: string;
  className?: string;
};

/** Title + year/place — under the frame, left-aligned. */
export function TheaterRamsIdentity({
  isLight = false,
  filmTitle,
  filmMeta,
  filmCredit,
  className = '',
}: IdentityProps) {
  const muted = isLight ? 'text-[#0B0B0C]/55' : 'text-[#F5F5F7]/55';
  const ink = isLight ? 'text-[#0B0B0C]' : 'text-[#F5F5F7]';

  if (!filmTitle && !filmMeta && !filmCredit) return null;

  return (
    <div
      data-ui-control="true"
      className={`flex min-w-0 w-full select-none flex-col items-start gap-1 text-left [@media(max-height:740px)]:gap-0.5 ${ink} ${className}`}
    >
      {filmTitle ? (
        <p className="truncate font-sans text-[15px] font-semibold leading-snug tracking-tight md:text-[16px] [@media(max-height:740px)]:text-[13px]">
          {filmTitle}
        </p>
      ) : null}
      {filmMeta ? (
        <p
          className={`truncate font-sans text-[12px] font-medium leading-snug tracking-normal [@media(max-height:740px)]:text-[11px] ${muted}`}
        >
          {filmMeta}
        </p>
      ) : null}
      {filmCredit ? (
        <p
          className={`truncate font-mono text-[11px] font-medium leading-snug tracking-normal [@media(max-height:740px)]:text-[10px] ${muted}`}
        >
          {filmCredit}
        </p>
      ) : null}
    </div>
  );
}

type ScrubberProps = {
  scrubberRef: React.RefObject<HTMLInputElement | null>;
  playheadRef: React.RefObject<HTMLDivElement | null>;
  /** Filled (played) portion of the track — width set by paintProgress. */
  playedFillRef: React.RefObject<HTMLDivElement | null>;
  elapsedRef: React.RefObject<HTMLSpanElement | null>;
  durationRef: React.RefObject<HTMLSpanElement | null>;
  isScrubbing: boolean;
  /** Plus mode — playhead becomes a note-anchor pin. */
  plusMode?: boolean;
  /** Slimmer clocks / taller hit target for the floating control stack. */
  compact?: boolean;
  /**
   * When set, clocks sit outside left/right and the track stacks above this
   * node at the same width (icon pill).
   * @deprecated Prefer TheaterControlChip seek-expand mode.
   */
  stackBelow?: React.ReactNode;
  /** Track only — fills parent (expandable pill). Clocks rendered by parent. */
  embedded?: boolean;
  onScrubStart: () => void;
  onScrubChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onScrubEnd: (e: React.SyntheticEvent<HTMLInputElement>) => void;
};

const RAMS_SCRUB_STYLE = `
  .fjorr-rams-scrub{
    min-width:0!important;
    width:100%!important;
  }
  .fjorr-rams-scrub::-webkit-slider-thumb{
    -webkit-appearance:none!important;
    appearance:none!important;
    width:48px!important;
    height:64px!important;
    background:transparent!important;
    border:0!important;
    border-radius:0!important;
    box-shadow:none!important;
    opacity:0!important;
  }
  .fjorr-rams-scrub::-moz-range-thumb{
    appearance:none!important;
    width:48px!important;
    height:64px!important;
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

const COLLAPSE_MS = 2600;

/** Scrubber — pill track; crosshatch fill for played; white playhead. */
export function TheaterRamsScrubber({
  scrubberRef,
  playheadRef,
  playedFillRef,
  elapsedRef,
  durationRef,
  isScrubbing,
  plusMode = false,
  compact = false,
  stackBelow,
  embedded = false,
  onScrubStart,
  onScrubChange,
  onScrubEnd,
}: ScrubberProps) {
  const hatch = '#F5F5F7';
  const stacked = Boolean(stackBelow);
  const clockClass =
    compact || stacked || embedded
      ? 'font-sans text-[12px] font-medium tabular-nums tracking-normal leading-none shrink-0 min-w-[2.6em] text-[#F5F5F7]/80 transition-colors duration-150 sm:text-[13px]'
      : 'font-sans text-[12px] font-medium tabular-nums tracking-normal leading-none shrink-0 min-w-[2.85em] text-[#F5F5F7]/70 transition-colors duration-150 [@media(max-height:740px)]:text-[11px]';
  const clockTone =
    isScrubbing || plusMode
      ? 'text-[#F5F5F7]'
      : compact || stacked || embedded
        ? 'text-[#F5F5F7]/80'
        : 'text-[#F5F5F7]/70';
  const trackH = embedded
    ? 'h-10 sm:h-11'
    : stacked || compact
      ? 'h-16'
      : 'h-9 [@media(max-height:740px)]:h-7';
  const barH = embedded
    ? 'h-[14px] sm:h-[16px]'
    : stacked || compact
      ? 'h-[20px]'
      : 'h-[7px] [@media(max-height:740px)]:h-[5px]';
  const headSize = embedded
    ? 'h-[14px] w-[14px] sm:h-[16px] sm:w-[16px]'
    : stacked || compact
      ? 'h-[20px] w-[20px]'
      : 'h-[7px] w-[7px] [@media(max-height:740px)]:h-[5px] [@media(max-height:740px)]:w-[5px]';
  const showBarShell = !embedded;

  const track = (
    <div className={`relative min-w-0 w-full ${trackH}`}>
      <div
        className={`pointer-events-none absolute inset-x-0 top-1/2 ${barH} -translate-y-1/2 overflow-hidden rounded-full ${
          showBarShell
            ? 'bg-black/50 shadow-[0_10px_36px_rgba(0,0,0,0.35)] backdrop-blur-xl'
            : 'bg-white/15'
        }`}
        aria-hidden
      >
        <div
          ref={playedFillRef}
          className="absolute inset-y-0 left-0 w-0 opacity-55"
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
        />
      </div>
      <div
        className={`pointer-events-none absolute inset-y-0 z-20 ${
          compact || stacked || embedded
            ? 'left-[10px] right-[10px]'
            : 'left-[8px] right-[8px]'
        }`}
        aria-hidden
      >
        <div
          ref={playheadRef}
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          {plusMode ? (
            <svg
              viewBox="0 0 16 16"
              className="h-4 w-4 text-[#8FE0F2]"
              fill="currentColor"
              aria-hidden
            >
              <path d="M6.25 1.5a1.75 1.75 0 0 1 3.5 0v4.75H14.5a1.75 1.75 0 0 1 0 3.5H9.75V14.5a1.75 1.75 0 0 1-3.5 0V9.75H1.5a1.75 1.75 0 0 1 0-3.5h4.75V1.5Z" />
            </svg>
          ) : (
            <div className={`rounded-full bg-[#F5F5F7] ${headSize}`} />
          )}
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
        className="fjorr-rams-scrub absolute inset-0 z-30 m-0 h-full w-full cursor-pointer touch-none appearance-none bg-transparent outline-none focus:outline-none focus:ring-0"
        style={{
          WebkitAppearance: 'none',
          appearance: 'none',
          background: 'transparent',
        }}
      />
    </div>
  );

  if (embedded) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: RAMS_SCRUB_STYLE }} />
        {track}
      </>
    );
  }

  if (stacked) {
    return (
      <div
        data-ui-control="true"
        className="pointer-events-auto inline-flex select-none items-start gap-2 sm:gap-2.5"
      >
        <style dangerouslySetInnerHTML={{ __html: RAMS_SCRUB_STYLE }} />
        <span
          ref={elapsedRef}
          className={`${clockClass} flex h-16 items-center text-right ${clockTone}`}
        />
        <div className="flex w-max min-w-0 flex-col items-stretch gap-1">
          {track}
          {stackBelow}
        </div>
        <span
          ref={durationRef}
          className={`${clockClass} flex h-16 items-center text-left ${clockTone}`}
        />
      </div>
    );
  }

  return (
    <div
      data-ui-control="true"
      className="pointer-events-auto flex w-full select-none items-center gap-2"
    >
      <style dangerouslySetInnerHTML={{ __html: RAMS_SCRUB_STYLE }} />
      <span ref={elapsedRef} className={`${clockClass} text-left ${clockTone}`} />
      <div className="min-w-0 flex-1">{track}</div>
      <span
        ref={durationRef}
        className={`${clockClass} text-right ${clockTone}`}
      />
    </div>
  );
}

type ControlChipProps = {
  visible: boolean;
  toolsLeading: React.ReactNode;
  toolsTrailing: React.ReactNode;
  scrubber: React.ReactElement<ScrubberProps>;
  isScrubbing: boolean;
  plusMode?: boolean;
  /** Keep theater chrome awake while seek mode is open. */
  onKeepAwake?: () => void;
};

/**
 * Floating control pill — time chip in the middle; tap expands the whole
 * pill into a scrub bar. Collapses as soon as the pointer leaves (touch
 * keeps a short fallback after scrub).
 */
export function TheaterControlChip({
  visible,
  toolsLeading,
  toolsTrailing,
  scrubber,
  isScrubbing,
  plusMode = false,
  onKeepAwake,
}: ControlChipProps) {
  const [seekOpen, setSeekOpen] = useState(false);
  const [pillWidth, setPillWidth] = useState<number | null>(null);
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collapsedPillRef = useRef<HTMLDivElement | null>(null);
  const isScrubbingRef = useRef(isScrubbing);
  isScrubbingRef.current = isScrubbing;
  const open = seekOpen || plusMode;

  const clearCollapseTimer = useCallback(() => {
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
  }, []);

  const collapseSeek = useCallback(() => {
    if (plusMode || isScrubbingRef.current) return;
    clearCollapseTimer();
    setSeekOpen(false);
  }, [clearCollapseTimer, plusMode]);

  const scheduleCollapse = useCallback(() => {
    clearCollapseTimer();
    if (plusMode) return;
    collapseTimerRef.current = setTimeout(() => {
      setSeekOpen(false);
      collapseTimerRef.current = null;
    }, COLLAPSE_MS);
  }, [clearCollapseTimer, plusMode]);

  const openSeek = useCallback(() => {
    const width = collapsedPillRef.current?.offsetWidth ?? null;
    if (width && width > 0) setPillWidth(width);
    setSeekOpen(true);
    onKeepAwake?.();
    clearCollapseTimer();
  }, [clearCollapseTimer, onKeepAwake]);

  useEffect(() => {
    if (!visible) {
      setSeekOpen(false);
      clearCollapseTimer();
    }
  }, [visible, clearCollapseTimer]);

  useEffect(() => {
    if (isScrubbing) {
      if (!seekOpen && collapsedPillRef.current) {
        const width = collapsedPillRef.current.offsetWidth;
        if (width > 0) setPillWidth(width);
      }
      setSeekOpen(true);
      clearCollapseTimer();
      onKeepAwake?.();
      return;
    }
  }, [isScrubbing, seekOpen, clearCollapseTimer, onKeepAwake]);

  // After a scrub ends, touch may never fire leave — soft fallback only then.
  const wasScrubbingRef = useRef(false);
  useEffect(() => {
    if (isScrubbing) {
      wasScrubbingRef.current = true;
      return;
    }
    if (wasScrubbingRef.current && seekOpen && !plusMode) {
      wasScrubbingRef.current = false;
      scheduleCollapse();
    }
  }, [isScrubbing, seekOpen, plusMode, scheduleCollapse]);

  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => onKeepAwake?.());
    return () => window.cancelAnimationFrame(id);
  }, [open, onKeepAwake]);

  useEffect(() => () => clearCollapseTimer(), [clearCollapseTimer]);

  const elapsedRef = scrubber.props.elapsedRef;
  const durationRef = scrubber.props.durationRef;
  const embeddedScrubber = React.cloneElement(scrubber, {
    embedded: true,
    compact: true,
  });

  const pillShell =
    'rounded-full border-0 bg-black/50 text-[#F5F5F7] shadow-[0_10px_36px_rgba(0,0,0,0.35)] backdrop-blur-xl';

  return (
    <div
      data-ui-control="true"
      className={`pointer-events-none absolute inset-0 z-40 flex items-center justify-center px-3 transition-opacity duration-300 ease-out sm:px-5 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden={!visible}
    >
      <div
        className={visible ? 'pointer-events-auto' : 'pointer-events-none'}
        onPointerDown={() => onKeepAwake?.()}
      >
        {open ? (
          <div
            className={`flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 ${pillShell}`}
            style={pillWidth ? { width: pillWidth } : undefined}
            onPointerDown={() => {
              clearCollapseTimer();
              onKeepAwake?.();
            }}
            onPointerLeave={collapseSeek}
          >
            <span
              ref={elapsedRef}
              className="pointer-events-none shrink-0 font-sans text-[12px] font-medium tabular-nums leading-none tracking-normal text-[#F5F5F7]/80 sm:text-[13px]"
            />
            <div className="min-w-0 flex-1">{embeddedScrubber}</div>
            <span
              ref={durationRef}
              className="pointer-events-none shrink-0 font-sans text-[12px] font-medium tabular-nums leading-none tracking-normal text-[#F5F5F7]/80 sm:text-[13px]"
            />
          </div>
        ) : (
          <div
            ref={collapsedPillRef}
            className={`flex items-center justify-center gap-0.5 px-1.5 py-1.5 sm:gap-1 sm:px-2 sm:py-2 ${pillShell}`}
          >
            {toolsLeading}
            <button
              type="button"
              onClick={openSeek}
              aria-label="Show scrubber"
              className="mx-0.5 inline-flex h-8 min-w-[4.75rem] items-center justify-center gap-1 rounded-full px-2.5 font-sans text-[12px] font-medium tabular-nums leading-none tracking-normal text-[#F5F5F7]/90 transition-colors hover:bg-white/10 hover:text-[#F5F5F7] sm:h-9 sm:min-w-[5.25rem] sm:text-[13px]"
            >
              <span ref={elapsedRef} />
              <span className="text-[#F5F5F7]/35" aria-hidden>
                /
              </span>
              <span ref={durationRef} />
            </button>
            {toolsTrailing}
          </div>
        )}
      </div>
    </div>
  );
}

type DockProps = {
  isLight?: boolean;
  filmTitle?: string;
  filmMeta?: string;
  filmCredit?: string;
  toolsSlot?: React.ReactNode;
  belowToolsSlot?: React.ReactNode;
};

/** @deprecated Prefer TheaterRamsIdentity under the frame + TheaterControlChip. */
export function TheaterRamsDock({
  isLight = false,
  filmTitle,
  filmMeta,
  filmCredit,
  toolsSlot,
  belowToolsSlot,
}: DockProps) {
  const muted = isLight ? 'text-[#0B0B0C]/55' : 'text-[#F5F5F7]/55';

  return (
    <div
      data-ui-control="true"
      className="pointer-events-auto flex w-full max-w-[min(92vw,22rem)] select-none flex-col items-start gap-2.5 text-left [@media(max-height:740px)]:gap-1.5"
    >
      <TheaterRamsIdentity
        isLight={isLight}
        filmTitle={filmTitle}
        filmMeta={filmMeta}
        filmCredit={filmCredit}
      />
      {toolsSlot ? (
        <div
          className={`flex flex-wrap items-center justify-start gap-x-2.5 gap-y-1 [@media(max-height:740px)]:gap-x-2 ${muted}`}
        >
          {toolsSlot}
        </div>
      ) : null}
      {belowToolsSlot ? (
        <div className="w-full [@media(max-height:740px)]:max-h-[36dvh] [@media(max-height:740px)]:overflow-y-auto">
          {belowToolsSlot}
        </div>
      ) : null}
    </div>
  );
}

/** Legacy plaque width — kept for any external refs. */
export const PLAQUE_WIDTH =
  'w-[min(72vw,300px)] sm:w-[min(58vw,420px)] lg:w-[min(48vw,560px)] xl:w-[min(42vw,640px)]';

/** @deprecated Prefer TheaterRamsScrubber + TheaterControlChip + TheaterRamsIdentity. */
export default function TheaterRamsChrome(
  props: ScrubberProps & DockProps & { isLight?: boolean }
) {
  return (
    <div className="flex w-full flex-col gap-3">
      <TheaterRamsScrubber {...props} />
      <TheaterRamsDock {...props} />
    </div>
  );
}
