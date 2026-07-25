'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import SearchNadaView from '@/components/SearchNadaView';
import { groupByStoryYear } from '@/lib/story-year';

export type TimelineRailItem = {
  id: string;
  name: string;
  teaser: string | null;
  href: string;
  sortDate: string | null;
  image?: string | null;
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
 */
export default function TimelineRail({
  items,
  storageKey,
  groupKeyPrefix = 't',
}: {
  items: TimelineRailItem[];
  storageKey: string;
  groupKeyPrefix?: string;
}) {
  const tTime = useTranslations('Timeline');
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
    return (
      <div className="flex w-full justify-center py-6">
        <SearchNadaView />
      </div>
    );
  }

  return (
    <div className="relative w-full mt-6 pb-24">
      {/* Viewport-centered spine */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-white/20"
        aria-hidden
      />

      {/* Match search bar width (max-w-sm) so text ends at its right edge */}
      <div className="relative z-10 mx-auto w-full max-w-sm flex flex-col">
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
                    className="relative z-10 px-3 py-2 flex flex-col items-center gap-1 text-white/40"
                    style={{
                      backgroundColor: 'var(--page-bg-color, #1F1F1F)',
                    }}
                  >
                    <span className="font-mono text-[22px] md:text-[26px] font-semibold tracking-tight leading-none">
                      {primary}
                    </span>
                    {secondary ? (
                      <span className="font-mono text-[10px] md:text-[11px] font-medium uppercase tracking-[0.14em] leading-none text-white/35">
                        {secondary}
                      </span>
                    ) : null}
                  </h2>
                );
              })()}
            </div>

            <ul className="flex flex-col gap-12 md:gap-14 pb-6 md:pb-8">
              {group.films.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={rememberScroll}
                    className="group grid grid-cols-2 gap-x-8 md:gap-x-10 items-start w-full"
                  >
                    <div className="flex justify-end">
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
                        <div className="w-[72px] sm:w-[80px] aspect-[2/3] rounded-[10px] bg-white/10" />
                      )}
                    </div>

                    <div className="min-w-0 pt-0.5">
                      <h3 className="font-sans text-[16px] md:text-[17px] font-bold tracking-tight text-white leading-snug group-hover:text-white/85 transition-colors">
                        {item.name}
                      </h3>
                      {item.teaser ? (
                        <p className="mt-2 font-sans text-[13px] font-normal text-white/45 leading-relaxed line-clamp-4">
                          {item.teaser}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
