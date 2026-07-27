'use client';

import React, { useCallback, useRef } from 'react';

type Props = {
  progressRef: React.RefObject<SVGCircleElement | null>;
  timeRef: React.RefObject<HTMLSpanElement | null>;
  isPlaying: boolean;
  isScrubbing: boolean;
  isLight?: boolean;
  captionsActive?: boolean;
  showCCMenu?: boolean;
  playIcon: React.ReactNode;
  rewindIcon: React.ReactNode;
  forwardIcon: React.ReactNode;
  captionsIcon: React.ReactNode;
  fullscreenIcon: React.ReactNode;
  volumeIcon: React.ReactNode;
  playLabel: string;
  pauseLabel: string;
  rewindLabel: string;
  forwardLabel: string;
  captionsLabel: string;
  fullscreenLabel: string;
  muteLabel: string;
  unmuteLabel: string;
  isMuted: boolean;
  onTogglePlay: () => void;
  onSeekBack: () => void;
  onSeekForward: () => void;
  onToggleCaptions: () => void;
  onToggleFullscreen: () => void;
  onToggleMute: () => void;
  onScrubStart: () => void;
  onScrubTo: (ratio: number) => void;
  onScrubEnd: () => void;
};

/** SVG geometry — viewBox 100×100, ring centered. */
const CX = 50;
const CY = 50;
const R = 42;
const CIRC = 2 * Math.PI * R;
const SIZE_CLASS =
  'w-[min(48vmin,300px)] h-[min(48vmin,300px)] sm:w-[min(40vmin,320px)] sm:h-[min(40vmin,320px)]';

function pointerToRatio(clientX: number, clientY: number, el: Element) {
  const rect = el.getBoundingClientRect();
  const x = clientX - (rect.left + rect.width / 2);
  const y = clientY - (rect.top + rect.height / 2);
  // 0 at top, clockwise
  const angle = (Math.atan2(y, x) + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
  return angle / (Math.PI * 2);
}

function FjorrMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 143 81"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M71.3559 13.2942C60.8993 13.2942 52.4273 21.7814 52.4273 32.2448C52.4273 42.7082 60.9046 51.1953 71.3559 51.1953C81.8073 51.1953 90.2846 42.7082 90.2846 32.2448C90.2846 21.7814 81.8073 13.2942 71.3559 13.2942ZM71.3559 39.7278C67.232 39.7278 63.8869 36.3789 63.8869 32.2501C63.8869 28.1214 67.232 24.7725 71.3559 24.7725C75.4799 24.7725 78.825 28.1214 78.825 32.2501C78.825 36.3789 75.4799 39.7278 71.3559 39.7278Z"
        fill="currentColor"
      />
      <path
        d="M35.9047 15.0355C35.4032 15.0355 34.9978 15.4414 34.9978 15.9435V60.9377C34.9978 65.4136 31.5887 69.0883 27.23 69.505C26.7605 69.5477 26.403 69.9322 26.403 70.4023V80.0912C26.403 80.6146 26.8405 81.0206 27.3633 80.9992C37.996 80.4971 46.4627 71.7109 46.4627 60.9377V15.9435C46.4627 15.4414 46.0573 15.0355 45.5558 15.0355H35.9047Z"
        fill="currentColor"
      />
      <path
        d="M0 0.908003V48.498C0 49.0001 0.405462 49.406 0.906954 49.406H11.9931C12.4946 49.406 12.9001 49.0001 12.9001 48.498V35.1397C12.9001 34.6376 13.3055 34.2317 13.807 34.2317H26.0616C26.5631 34.2317 26.9685 33.8258 26.9685 33.3237V23.6615C26.9685 23.1594 26.5631 22.7535 26.0616 22.7535H13.807C13.3055 22.7535 12.9001 22.3476 12.9001 21.8455V12.3755C12.9001 11.8735 13.3055 11.4675 13.807 11.4675H27.4967C27.9982 11.4675 28.4037 11.0616 28.4037 10.5595V0.908003C28.4037 0.405931 27.9982 0 27.4967 0H0.906954C0.405462 0 0 0.405931 0 0.908003Z"
        fill="currentColor"
      />
      <path
        d="M116.309 15.9435V22.7375C116.309 23.2395 115.402 23.6455 115.402 23.6455H108.509C108.066 23.6455 107.709 24.0033 107.709 24.4466V48.5568C107.709 49.0589 107.303 49.4648 106.802 49.4648H97.1508C96.6493 49.4648 96.2438 49.0589 96.2438 48.5568V15.9435C96.2438 15.4414 96.6493 15.0355 97.1508 15.0355H115.402C115.903 15.0355 116.309 15.4414 116.309 15.9435Z"
        fill="currentColor"
      />
      <path
        d="M143 15.9435V22.7375C143 23.2395 142.595 23.6455 142.093 23.6455H135.2C134.757 23.6455 134.4 24.0033 134.4 24.4466V48.5568C134.4 49.0589 133.994 49.4648 133.493 49.4648H123.842C123.34 49.4648 122.935 49.0589 122.935 48.5568V15.9435C122.935 15.4414 123.34 15.0355 123.842 15.0355H142.093C142.595 15.0355 143 15.4414 143 15.9435Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Centered circle timeline — logo + play + single clock inside,
 * ±10 flanking, secondary actions under the ring.
 */
export default function TheaterCircleControl({
  progressRef,
  timeRef,
  isPlaying,
  isScrubbing,
  isLight = false,
  captionsActive = false,
  showCCMenu = false,
  playIcon,
  rewindIcon,
  forwardIcon,
  captionsIcon,
  fullscreenIcon,
  volumeIcon,
  playLabel,
  pauseLabel,
  rewindLabel,
  forwardLabel,
  captionsLabel,
  fullscreenLabel,
  muteLabel,
  unmuteLabel,
  isMuted,
  onTogglePlay,
  onSeekBack,
  onSeekForward,
  onToggleCaptions,
  onToggleFullscreen,
  onToggleMute,
  onScrubStart,
  onScrubTo,
  onScrubEnd,
}: Props) {
  const ringRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  const trackStroke = isLight ? 'rgba(11,11,12,0.14)' : 'rgba(245,245,247,0.22)';
  const ink = isLight ? 'text-[#0B0B0C]' : 'text-[#F5F5F7]';
  const muted = isLight ? 'text-[#0B0B0C]/50' : 'text-[#F5F5F7]/50';

  const scrubFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      const root = ringRef.current;
      if (!root) return;
      onScrubTo(pointerToRatio(clientX, clientY, root));
    },
    [onScrubTo]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest('[data-circle-core]')) return;
      e.preventDefault();
      draggingRef.current = true;
      ringRef.current?.setPointerCapture(e.pointerId);
      onScrubStart();
      scrubFromEvent(e.clientX, e.clientY);
    },
    [onScrubStart, scrubFromEvent]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      scrubFromEvent(e.clientX, e.clientY);
    },
    [scrubFromEvent]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      try {
        ringRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      onScrubEnd();
    },
    [onScrubEnd]
  );

  const sideBtn =
    'w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity bg-transparent border-0 outline-none cursor-pointer shrink-0';
  const toolBtn =
    'w-10 h-10 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity bg-transparent border-0 outline-none cursor-pointer';

  return (
    <div
      data-ui-control="true"
      className={`pointer-events-auto flex flex-col items-center gap-5 sm:gap-6 select-none ${ink}`}
    >
      <div className="flex items-center justify-center gap-3 sm:gap-5 md:gap-7">
        <button
          type="button"
          onClick={onSeekBack}
          className={sideBtn}
          title={rewindLabel}
        >
          {rewindIcon}
        </button>

        <div
          ref={ringRef}
          className={`relative ${SIZE_CLASS} touch-none ${isScrubbing ? 'cursor-grabbing' : 'cursor-grab'}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full -rotate-90"
            aria-hidden
          >
            <circle
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke={trackStroke}
              strokeWidth="1.25"
            />
            <circle
              ref={progressRef}
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke="#ffd446"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC}
              style={{ transition: isScrubbing ? 'none' : 'stroke-dashoffset 80ms linear' }}
            />
          </svg>

          <div
            data-circle-core
            className="absolute inset-[18%] flex flex-col items-center justify-center gap-1.5 sm:gap-2 pointer-events-auto"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <FjorrMark className={`w-10 sm:w-12 h-auto ${ink}`} />

            <button
              type="button"
              onClick={onTogglePlay}
              className={`flex items-center justify-center bg-transparent border-0 outline-none cursor-pointer transition-opacity hover:opacity-100 p-1 ${
                isPlaying ? 'opacity-75' : 'opacity-95'
              }`}
              title={isPlaying ? pauseLabel : playLabel}
            >
              {playIcon}
            </button>

            <span
              ref={timeRef}
              className={`font-mono text-[12px] sm:text-[13px] font-semibold tabular-nums tracking-tight leading-none ${muted}`}
            >
              0:00
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onSeekForward}
          className={sideBtn}
          title={forwardLabel}
        >
          {forwardIcon}
        </button>
      </div>

      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={onToggleCaptions}
          aria-pressed={captionsActive}
          className={`${toolBtn} ${
            captionsActive || showCCMenu ? 'opacity-100' : ''
          } ${captionsActive ? 'text-[#ffd446]' : ''}`}
          title={captionsLabel}
        >
          {captionsIcon}
        </button>
        <button
          type="button"
          onClick={onToggleFullscreen}
          className={toolBtn}
          title={fullscreenLabel}
        >
          {fullscreenIcon}
        </button>
        <button
          type="button"
          onClick={onToggleMute}
          className={toolBtn}
          title={isMuted ? unmuteLabel : muteLabel}
        >
          {volumeIcon}
        </button>
      </div>
    </div>
  );
}

export const THEATER_CIRCLE_CIRCUMFERENCE = CIRC;
