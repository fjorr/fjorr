'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { HALL_OF_WINS, type HallOfWin } from './hall-of-wins';

type Props = {
  wins?: HallOfWin[];
  /** Primary CTA — lives with arrows, not on each card. */
  ctaHref?: string;
  ctaLabel?: string;
  /** Secondary — catalog / upcoming rewards. */
  secondaryHref?: string;
  secondaryLabel?: string;
  className?: string;
  /** Auto-advance interval ms; 0 = off. */
  autoMs?: number;
};

/**
 * Hall of Wins — Bureaux-style poster as a carousel of top wins.
 * Cream card · copy left · inset photo right. One win per slide.
 */
export default function HallOfWinsRail({
  wins = HALL_OF_WINS,
  ctaHref = '/preview/story-inc/projects',
  ctaLabel = 'Predict to win',
  secondaryHref = 'https://app.storyincmedia.com/rewards',
  secondaryLabel = 'View rewards',
  className = '',
  autoMs = 5500,
}: Props) {
  const [index, setIndex] = useState(0);
  const n = wins.length;

  const go = useCallback(
    (dir: -1 | 1) => {
      setIndex((i) => (i + dir + n) % n);
    },
    [n],
  );

  const goTo = useCallback((i: number) => setIndex(i), []);

  useEffect(() => {
    if (!autoMs || n < 2) return;
    const id = window.setInterval(() => go(1), autoMs);
    return () => window.clearInterval(id);
  }, [autoMs, go, n, index]);

  const win = wins[index] ?? wins[0];
  if (!win) return null;

  return (
    <section
      className={`w-full ${className}`}
      aria-roledescription="carousel"
      aria-label="Hall of Wins"
    >
      <div className="mx-auto max-w-[1120px] px-5">
        <WinPoster win={win} slideLabel={`${index + 1} of ${n}`} />

        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            {n > 1 ? (
              <div
                className="flex items-center gap-2"
                role="tablist"
                aria-label="Wins"
              >
                {wins.map((w, i) => (
                  <button
                    key={w.id}
                    type="button"
                    role="tab"
                    aria-selected={i === index}
                    aria-label={`${w.reward}, ${w.winner}`}
                    onClick={() => goTo(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === index
                        ? 'w-6 bg-[#1d1d1f]'
                        : 'w-2 bg-[#1d1d1f]/25 hover:bg-[#1d1d1f]/4'
                    }`}
                  />
                ))}
              </div>
            ) : null}
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <Link
                href={ctaHref}
                className="truncate text-[13px] font-semibold text-[#00a6ff] underline-offset-4 transition-opacity hover:opacity-80 hover:underline"
              >
                {ctaLabel}
              </Link>
              {secondaryHref && secondaryLabel ? (
                <>
                  <span
                    aria-hidden
                    className="text-[13px] font-medium text-[#1d1d1f]/2"
                  >
                    ·
                  </span>
                  <Link
                    href={secondaryHref}
                    className="truncate text-[13px] font-semibold text-[#1d1d1f]/45 underline-offset-4 transition-colors hover:text-[#1d1d1f] hover:underline"
                  >
                    {secondaryLabel}
                  </Link>
                </>
              ) : null}
            </div>
          </div>

          {n > 1 ? (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous win"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-[#f5f5f7] text-[#1d1d1f] transition-colors hover:bg-black/[0.06]"
              >
                <Chevron dir="left" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next win"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-[#f5f5f7] text-[#1d1d1f] transition-colors hover:bg-black/[0.06]"
              >
                <Chevron dir="right" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function WinPoster({
  win,
  slideLabel,
}: {
  win: HallOfWin;
  slideLabel: string;
}) {
  return (
    <div
      className="group relative flex w-full flex-col overflow-hidden rounded-[12px] bg-[#EEECEA] text-[#1d1d1f] sm:aspect-[21/9] sm:min-h-[260px] sm:flex-row"
      aria-label={`${win.reward}. ${slideLabel}`}
    >
      <div className="relative z-[1] flex flex-col justify-end gap-2.5 p-7 sm:w-[38%] sm:max-w-md sm:justify-center sm:gap-3 sm:p-9 md:p-10 lg:p-12">
        <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#00a6ff]">
          Hall of Wins
        </p>

        <p className="m-0 text-[12px] font-semibold tracking-tight text-[#1d1d1f]/55 sm:text-[13px]">
          <span className="text-[#1d1d1f]/35">Project</span>
          <span className="mx-1.5 text-[#1d1d1f]/25">·</span>
          {win.projectHref ? (
            <Link
              href={win.projectHref}
              className="text-[#1d1d1f]/70 transition-opacity hover:opacity-70"
            >
              {win.project}
            </Link>
          ) : (
            <span className="text-[#1d1d1f]/70">{win.project}</span>
          )}
        </p>

        <h2 className="m-0 text-[clamp(1.35rem,2.8vw,1.85rem)] font-extrabold leading-[1.15] tracking-tight normal-case">
          {win.reward}
        </h2>

        <p className="m-0 text-[12px] font-semibold tracking-tight text-[#1d1d1f]/55 sm:text-[13px]">
          <span className="text-[#1d1d1f]/35">Winners</span>
          <span className="mx-1.5 text-[#1d1d1f]/25">·</span>
          <span className="text-[#1d1d1f]/70">
            {win.winner} · {win.place}
          </span>
        </p>
      </div>

      <div className="relative flex w-full flex-1 items-stretch px-5 pb-5 pt-0 sm:p-6 sm:pl-0 md:p-8 md:pl-0">
        {/* Mobile: near-square portrait frame; desktop: fills the banner. */}
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[10px] sm:aspect-auto sm:min-h-0 sm:flex-1">
          <img
            key={win.id}
            src={win.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              objectPosition: win.imagePosition ?? 'center',
              // Landscape stills in a landscape banner can’t shift on Y without zoom.
              transform: win.imageScale ? `scale(${win.imageScale})` : undefined,
              transformOrigin: win.imagePosition ?? 'center',
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      {dir === 'left' ? (
        <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}
