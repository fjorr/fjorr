'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useMinimalFilter } from '@/components/MinimalFilterContext';
import SearchNadaView from '@/components/SearchNadaView';
import { groupByStoryYear } from '@/lib/story-year';
import type { MinimalFilm } from '@/components/MinimalHomeList';
import type { MinimalArtifact } from '@/components/MinimalArtifactList';

type TimelineItem = {
  id: string;
  name: string;
  slug: string;
  teaser: string | null;
  href: string;
};

function isComingSoon(releaseDate: string | null | undefined) {
  if (!releaseDate) return false;
  return new Date(releaseDate).getTime() > Date.now();
}

function releaseYearString(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const year = new Date(iso).getFullYear();
  return Number.isFinite(year) ? String(year) : null;
}

function timelineScrollKey(contentType: string) {
  return `fjorr-timeline-scroll:${contentType}`;
}

function readTimelineScroll(contentType: string): number {
  try {
    const raw = sessionStorage.getItem(timelineScrollKey(contentType));
    const value = raw == null ? 0 : Number(raw);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

function writeTimelineScroll(contentType: string, scrollLeft: number) {
  try {
    sessionStorage.setItem(timelineScrollKey(contentType), String(Math.max(0, scrollLeft)));
  } catch {
    // ignore quota / private mode
  }
}

/**
 * Time browse — horizontal scroll.
 * Films: story year. Artifacts: release year.
 * Years above a continuous rule; titles + teasers below.
 */
export default function TimelineHomeList({
  films,
  artifacts,
}: {
  films: MinimalFilm[];
  artifacts: MinimalArtifact[];
}) {
  const tTime = useTranslations('Timeline');
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { theme, mix, mixes, setThemes, contentType } = useMinimalFilter();
  const contentTypeRef = useRef(contentType);
  const restoredRef = useRef(false);
  const [showArrows, setShowArrows] = useState(false);
  const showingArtifacts = contentType === 'artifact';

  useEffect(() => {
    if (showingArtifacts) {
      setThemes([]);
      return;
    }
    const set = new Set<string>();
    for (const film of films) {
      if (film.theme) set.add(film.theme);
    }
    setThemes(Array.from(set).sort((a, b) => a.localeCompare(b)));
  }, [films, showingArtifacts, setThemes]);

  const visibleItems = useMemo(() => {
    if (showingArtifacts) {
      return artifacts.map(
        (a): TimelineItem & { sortDate: string | null } => ({
          id: a.id,
          name: a.name,
          slug: a.slug,
          teaser: a.teaser,
          href: `/artifact/${a.slug}`,
          sortDate: releaseYearString(a.release_date || a.created_at),
        }),
      );
    }

    let next = [...films];

    if (mix === 'coming-soon') {
      next = next.filter((f) => isComingSoon(f.release_date));
    } else if (mix !== 'all') {
      const selected = mixes.find((m) => m.slug === mix);
      if (selected) {
        const idSet = new Set(selected.filmIds);
        next = next.filter((f) => idSet.has(f.id));
      }
    }

    if (theme !== 'all') next = next.filter((f) => f.theme === theme);

    return next.map(
      (f): TimelineItem & { sortDate: string | null } => ({
        id: f.id,
        name: f.name,
        slug: f.slug,
        teaser: f.teaser,
        href: `/film/${f.slug}`,
        sortDate: f.story_date,
      }),
    );
  }, [artifacts, films, mix, mixes, showingArtifacts, theme]);

  const groups = useMemo(
    () =>
      groupByStoryYear(visibleItems, (item) => item.sortDate, tTime('undated')),
    [visibleItems, tTime],
  );

  useEffect(() => {
    const update = () => {
      const el = scrollerRef.current;
      setShowArrows(Boolean(el && el.scrollWidth > el.clientWidth + 8));
    };
    update();
    const raf = requestAnimationFrame(update);
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', update);
    };
  }, [groups.length, showingArtifacts]);

  // Persist / restore horizontal position across detail-page navigations.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const typeChanged = contentTypeRef.current !== contentType;
    if (typeChanged) {
      contentTypeRef.current = contentType;
      restoredRef.current = false;
      el.scrollLeft = 0;
      writeTimelineScroll(contentType, 0);
    } else if (!restoredRef.current && groups.length > 0) {
      restoredRef.current = true;
      const saved = readTimelineScroll(contentType);
      const apply = () => {
        el.scrollLeft = saved;
        setShowArrows(el.scrollWidth > el.clientWidth + 8);
      };
      requestAnimationFrame(() => requestAnimationFrame(apply));
    }

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        writeTimelineScroll(contentType, el.scrollLeft);
      });
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [contentType, groups.length]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      if (el.scrollWidth <= el.clientWidth) return;
      event.preventDefault();
      el.scrollLeft += event.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.7);
    el.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  const rememberScroll = () => {
    const el = scrollerRef.current;
    if (el) writeTimelineScroll(contentType, el.scrollLeft);
  };

  if (visibleItems.length === 0) {
    return (
      <div className="flex w-full justify-center py-6">
        <SearchNadaView />
      </div>
    );
  }

  const edgePad = 'max(1.25rem, calc((100% - 24rem) / 2))';

  return (
    <div className="w-full mt-8 md:mt-10">
      {showArrows && (
        <div className="hidden md:flex items-center justify-center gap-1.5 mb-8 select-none">
          <button
            type="button"
            aria-label={tTime('scrollEarlier')}
            onClick={() => scroll('left')}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/80 transition-all duration-200 text-[16px] font-sans font-bold cursor-pointer pb-0.5"
          >
            &lsaquo;
          </button>
          <button
            type="button"
            aria-label={tTime('scrollLater')}
            onClick={() => scroll('right')}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/80 transition-all duration-200 text-[16px] font-sans font-bold cursor-pointer pb-0.5"
          >
            &rsaquo;
          </button>
        </div>
      )}

      <div
        ref={scrollerRef}
        className="w-full overflow-x-auto overflow-y-hidden overscroll-x-contain pt-2 pb-20 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden touch-pan-x"
      >
        <div
          className="relative flex w-max items-start"
          style={{
            paddingLeft: edgePad,
            paddingRight: edgePad,
          }}
        >
          <div
            className="pointer-events-none absolute left-0 right-0 h-px bg-white/20"
            style={{ top: '2.5rem' }}
            aria-hidden
          />

          {groups.map((group, index) => (
            <section
              key={`${showingArtifacts ? 'a' : 'f'}-${group.year ?? 'undated'}`}
              className={`relative w-[180px] shrink-0 ${
                index < groups.length - 1 ? 'mr-12' : ''
              }`}
            >
              <p className="h-8 font-mono text-[17px] font-semibold tracking-tight text-white/40 leading-none">
                {group.label}
              </p>

              <span
                className="absolute left-0 top-10 w-1.5 h-1.5 -translate-y-1/2 rounded-full bg-white/55"
                aria-hidden
              />

              <div className="mt-8 flex flex-col gap-6">
                {group.films.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={rememberScroll}
                    className="group flex flex-col gap-2.5 min-w-0"
                  >
                    <h2 className="font-sans text-[15px] font-bold tracking-tight text-white leading-relaxed group-hover:text-white/85 transition-colors">
                      {item.name}
                    </h2>
                    {item.teaser && (
                      <p className="font-sans text-[13px] font-normal text-white/45 leading-relaxed line-clamp-3">
                        {item.teaser}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
