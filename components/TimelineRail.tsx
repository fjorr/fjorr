'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import SearchNadaView from '@/components/SearchNadaView';
import PrefetchLink from '@/components/PrefetchLink';
import { useWatchProgressMap } from '@/components/useWatchProgress';
import { formatResumeClock } from '@/lib/watch-progress';
import { groupByStoryYear } from '@/lib/story-year';

export type TimelineRailItem = {
  id: string;
  name: string;
  teaser: string | null;
  href: string;
  sortDate: string | null;
  image?: string | null;
  /** Film id for continue-watching lookup / resume. */
  filmId?: string | null;
  slug?: string | null;
  runtime?: number | null;
  mux_playback_id?: string | null;
  canResume?: boolean;
};

function readScroll(key: string): number {
  try {
    const raw = sessionStorage.getItem(key);
    const value = raw == null ? 0 : Number(raw);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

function writeScroll(key: string, scrollY: number) {
  try {
    sessionStorage.setItem(key, String(Math.max(0, scrollY)));
  } catch {
    // ignore
  }
}

/** "44 BC" → numbers on top, letters smaller below. Pure numbers stay single-line. */
function splitYearLabel(label: string): { primary: string; secondary: string | null } {
  if (!/[A-Za-z]/.test(label)) return { primary: label, secondary: null };
  const match = label.match(/^(-?\d[\d,]*)\s+(.+)$/);
  if (match) return { primary: match[1], secondary: match[2] };
  return { primary: label, secondary: null };
}

/**
 * Vertical Time rail — centered spine, posters left, titles right.
 * Resume only (no Play) when continue-watching progress exists.
 */
export default function TimelineRail({
  items,
  storageKey,
  groupKeyPrefix = 't',
  onResume,
}: {
  items: TimelineRailItem[];
  storageKey: string;
  groupKeyPrefix?: string;
  onResume?: (item: TimelineRailItem) => void;
}) {
  const tTime = useTranslations('Timeline');
  const tFilm = useTranslations('Film');
  const watchProgress = useWatchProgressMap();
  const storageKeyRef = useRef(storageKey);
  const restoredRef = useRef(false);

  const groups = useMemo(
    () => groupByStoryYear(items, (item) => item.sortDate, tTime('undated')),
    [items, tTime],
  );

  useEffect(() => {
    const keyChanged = storageKeyRef.current !== storageKey;
    if (keyChanged) {
      storageKeyRef.current = storageKey;
      restoredRef.current = false;
      writeScroll(storageKey, 0);
      window.scrollTo(0, 0);
    } else if (!restoredRef.current && groups.length > 0) {
      restoredRef.current = true;
      const saved = readScroll(storageKey);
      requestAnimationFrame(() => {
        window.scrollTo(0, saved);
      });
    }

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        writeScroll(storageKey, window.scrollY);
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [storageKey, groups.length]);

  const rememberScroll = () => {
    writeScroll(storageKey, window.scrollY);
  };

  if (items.length === 0) {
    return <SearchNadaView />;
  }

  return (
    <div className="relative w-full mt-6 pb-24">
      {/* Viewport-centered spine */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-page-line"
        aria-hidden
      />

      {/* Match search bar width (max-w-sm); inset on small screens so text clears the edge */}
      <div className="relative z-10 mx-auto w-full max-w-sm px-4 sm:px-5 flex flex-col">
        {groups.map((group) => (
          <section
            key={`${groupKeyPrefix}-${group.year ?? 'undated'}`}
            className="w-full"
          >
            <div className="flex justify-center py-10 md:py-12">
              {(() => {
                const { primary, secondary } = splitYearLabel(group.label);
                return (
                  <h2
                    className="relative z-10 px-3 py-2 flex flex-col items-center gap-1 text-page-faint"
                    style={{
                      backgroundColor: 'var(--page-bg-color, #1F1F1F)',
                    }}
                  >
                    <span className="font-mono text-[22px] md:text-[26px] font-semibold tracking-tight leading-none">
                      {primary}
                    </span>
                    {secondary ? (
                      <span className="font-mono text-[10px] md:text-[11px] font-medium uppercase tracking-[0.14em] leading-none text-page-faint">
                        {secondary}
                      </span>
                    ) : null}
                  </h2>
                );
              })()}
            </div>

            <ul className="flex flex-col gap-12 md:gap-14 pb-6 md:pb-8">
              {group.films.map((item) => {
                const filmId = item.filmId || item.id;
                const resume =
                  item.canResume && onResume
                    ? watchProgress[filmId] || watchProgress[item.id] || null
                    : null;

                return (
                  <li
                    key={item.id}
                    className="[content-visibility:auto] [contain-intrinsic-size:auto_240px]"
                  >
                    <div className="grid grid-cols-2 gap-x-8 md:gap-x-10 items-start w-full">
                      <PrefetchLink
                        href={item.href}
                        onClick={rememberScroll}
                        className="flex justify-end group"
                      >
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt=""
                            width={160}
                            height={240}
                            sizes="80px"
                            className="w-[72px] sm:w-[80px] h-auto rounded-[10px] transition-opacity duration-300 group-hover:opacity-90"
                          />
                        ) : (
                          <div className="w-[72px] sm:w-[80px] aspect-[2/3] rounded-[10px] bg-page-chip" />
                        )}
                      </PrefetchLink>

                      <div className="min-w-0 pt-0.5 flex flex-col gap-2.5">
                        <PrefetchLink
                          href={item.href}
                          onClick={rememberScroll}
                          className="group flex flex-col gap-2 min-w-0"
                        >
                          <h3 className="font-sans text-[16px] md:text-[17px] font-bold tracking-tight text-page leading-snug group-hover:opacity-85 transition-opacity">
                            {item.name}
                          </h3>
                          {item.teaser ? (
                            <p className="font-sans text-[13px] font-normal text-page-muted leading-relaxed line-clamp-4">
                              {item.teaser}
                            </p>
                          ) : null}
                        </PrefetchLink>

                        {resume && onResume ? (
                          <button
                            type="button"
                            onClick={() => {
                              rememberScroll();
                              onResume(item);
                            }}
                            className="self-start h-8 px-3 rounded-[6px] bg-page-chip-active font-sans text-[13px] font-semibold text-page hover:bg-page-chip-hover transition-colors whitespace-nowrap"
                          >
                            {tFilm('resume', {
                              time: formatResumeClock(resume.seconds),
                            })}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
