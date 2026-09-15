'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useLocale } from 'next-intl';
import { getPathname, useRouter } from '@/i18n/navigation';
import { type AppLocale } from '@/i18n/config';
import TheaterOpenShell from '@/components/TheaterOpenShell';
import Navbar from '@/components/Navbar';
import { openTheaterFromFilm } from '@/lib/theater-open';
import {
  finishWatchProgress,
  trackWatchProgress,
} from '@/lib/watch-progress';
import HouseFooter from '@/components/house/HouseFooter';
import { type ShortcutAction } from '@/components/house/ShortcutsPanel';
import HouseFrameNav from '@/components/house/HouseFrameNav';
import HousePosterDots from '@/components/house/HousePosterDots';
import HouseHeroPreview from '@/components/house/HouseHeroPreview';
import HouseHeroCopy from '@/components/house/HouseHeroCopy';
import { useHeroCopyFade } from '@/components/house/useHeroCopyFade';
import ExhibitionSheet, { type ExhibitionFilm } from '@/components/house/ExhibitionSheet';
import { useHouseOverlay } from '@/components/HouseOverlayProvider';
import {
  HOUSE_STAGE_SIDE_CLASS,
  houseStageSidePx,
} from '@/components/house/house-stage-margins';

const CinemaTheater = dynamic(() => import('@/components/CinemaTheater'), {
  ssr: false,
  loading: () => <TheaterOpenShell />,
});

/** Poster-ready rail entry — enough for cross-fade + play without a remount. */
export type FilmStageRailItem = {
  id: string;
  slug: string;
  name: string;
  teaser: string | null;
  runtime: number | null;
  comingSoon: boolean;
  muxPlaybackId: string | null;
  heroWide: string | null;
  heroClsx: string | null;
  heroTall: string | null;
  blokTall: string | null;
  blokOgrf: string | null;
  sponsor: string | null;
  rating: string | null;
  storyDate: string | null;
  location: string | null;
  titleArtCode: string | null;
  titleArtHex: string | null;
  titleArtScale: number | null;
};

export type FilmStageProps = {
  /** SSR film for this URL — exhibition + JSON-LD live here. */
  id: string;
  slug: string;
  exhibition: ExhibitionFilm;
  rail: FilmStageRailItem[];
};

type HeroFrame = 'wide' | 'clsx' | 'tall';

function heroSrc(item: FilmStageRailItem, frame: HeroFrame) {
  if (frame === 'wide') return item.heroWide || item.heroClsx || item.heroTall;
  if (frame === 'clsx') return item.heroClsx || item.heroWide || item.heroTall;
  return item.heroTall || item.heroClsx || item.heroWide;
}

function useHeroFrame(): HeroFrame {
  const [frame, setFrame] = useState<HeroFrame>('wide');
  useEffect(() => {
    const apply = () => {
      const side = houseStageSidePx(window.innerWidth);
      const chrome = 54;
      const aspect =
        (window.innerWidth - side * 2) /
        Math.max(window.innerHeight - chrome * 2, 1);
      setFrame(aspect >= 1.5 ? 'wide' : aspect >= 0.75 ? 'clsx' : 'tall');
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);
  return frame;
}

function filmHref(slug: string, locale: AppLocale) {
  return getPathname({ href: `/film/${slug}`, locale });
}

export default function FilmStage({ id, slug, exhibition, rail: railProp }: FilmStageProps) {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const frame = useHeroFrame();
  const { active, setShortcutHandler, isOpen, toggle } =
    useHouseOverlay();
  const sheetOpen = active != null;
  const searchOpen = isOpen('search');
  const pinFooter = sheetOpen && !searchOpen;

  const rail = railProp.length ? railProp : [];
  const initialIndex = Math.max(
    0,
    rail.findIndex((item) => item.slug === slug)
  );

  const [index, setIndex] = useState(initialIndex);
  const [dir, setDir] = useState(1);
  const [phase, setPhase] = useState<'idle' | 'from' | 'to'>('idle');
  const leavingRef = useRef<number | null>(null);
  const softNavRef = useRef(false);

  const [infoOpen, setInfoOpen] = useState(false);
  const [showTheater, setShowTheater] = useState(false);
  const [selectedFilm, setSelectedFilm] = useState<any>(null);
  const [startAt, setStartAt] = useState<number | undefined>(undefined);
  const [seekKey, setSeekKey] = useState(0);
  const current = rail[index] ?? rail[0];
  const previewPaused = sheetOpen || infoOpen || showTheater;
  const { displayIndex: copyIndex, visible: copyVisible } = useHeroCopyFade(
    phase,
    index
  );
  const copyFilm = rail[copyIndex] ?? current;

  const entrySlug = slug;

  /** Info only when URL says so — always clear on bare `/film/[slug]` landings. */
  useLayoutEffect(() => {
    setInfoOpen(window.location.hash === '#info');
  }, [slug]);

  useEffect(() => {
    const syncInfoFromHash = () => {
      setInfoOpen(window.location.hash === '#info');
    };
    window.addEventListener('hashchange', syncInfoFromHash);
    return () => window.removeEventListener('hashchange', syncInfoFromHash);
  }, []);

  useEffect(() => {
    const onCommandOpen = () => {
      setInfoOpen(false);
    };
    window.addEventListener('fjorr_command_open', onCommandOpen);
    return () => window.removeEventListener('fjorr_command_open', onCommandOpen);
  }, []);

  const syncUrl = useCallback(
    (nextSlug: string, hash = '') => {
      const path = filmHref(nextSlug, locale);
      softNavRef.current = true;
      window.history.pushState({ filmSlug: nextSlug }, '', `${path}${hash}`);
      const label = rail.find((item) => item.slug === nextSlug)?.name;
      if (label) document.title = `${label} | Fjorr`;
      router.prefetch(`/film/${nextSlug}`);
    },
    [locale, rail, router]
  );

  const goTo = useCallback(
    (next: number) => {
      if (rail.length < 2) return;
      const wrapped = ((next % rail.length) + rail.length) % rail.length;
      if (wrapped === index) return;
      let delta = wrapped - index;
      if (delta > rail.length / 2) delta -= rail.length;
      if (delta < -rail.length / 2) delta += rail.length;
      leavingRef.current = index;
      setDir(delta >= 0 ? 1 : -1);
      setPhase('from');
      setIndex(wrapped);
      const nextFilm = rail[wrapped];
      if (nextFilm?.slug) {
        setInfoOpen(false);
        syncUrl(nextFilm.slug);
      }
    },
    [index, rail, syncUrl]
  );

  const goRail = useCallback((delta: number) => goTo(index + delta), [goTo, index]);

  useEffect(() => {
    if (phase !== 'from') return;
    let frame2 = 0;
    const frame1 = window.requestAnimationFrame(() => {
      frame2 = window.requestAnimationFrame(() => setPhase('to'));
    });
    return () => {
      window.cancelAnimationFrame(frame1);
      window.cancelAnimationFrame(frame2);
    };
  }, [phase, index]);

  useEffect(() => {
    if (phase !== 'to') return;
    const clear = window.setTimeout(() => {
      leavingRef.current = null;
      setPhase('idle');
    }, 700);
    return () => window.clearTimeout(clear);
  }, [phase, index]);

  // Hard navigation / SSR remount lands on a new slug — snap without animation.
  useEffect(() => {
    const i = rail.findIndex((item) => item.slug === slug);
    if (i >= 0 && i !== index && !softNavRef.current) {
      setIndex(i);
      setPhase('idle');
      leavingRef.current = null;
    }
    softNavRef.current = false;
    // Only re-sync when the server slug prop changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    const onPop = () => {
      const path = window.location.pathname;
      const match = path.match(/\/film\/([^/]+)/);
      const nextSlug = match?.[1];
      if (!nextSlug) return;
      const i = rail.findIndex((item) => item.slug === nextSlug);
      if (i < 0 || i === index) return;
      softNavRef.current = true;
      leavingRef.current = index;
      setDir(i > index ? 1 : -1);
      setPhase('from');
      setIndex(i);
      setInfoOpen(window.location.hash === '#info');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [index, rail]);

  const openInfo = useCallback(() => {
    if (!current) return;
    // Exhibition payload is SSR for the entry film only — hard-nav for others.
    if (current.slug !== entrySlug) {
      router.push(`/film/${current.slug}#info`);
      return;
    }
    setInfoOpen(true);
    if (window.location.hash !== '#info') {
      window.history.replaceState(
        { filmSlug: current.slug },
        '',
        `${filmHref(current.slug, locale)}#info`
      );
    }
  }, [current, entrySlug, locale, router]);

  const closeInfo = useCallback(() => {
    setInfoOpen(false);
    if (current && window.location.hash === '#info') {
      window.history.replaceState(
        { filmSlug: current.slug },
        '',
        filmHref(current.slug, locale)
      );
    }
  }, [current, locale]);

  useEffect(() => {
    // Keep in sync when soft-nav lands on this entry without #info.
    setInfoOpen(window.location.hash === '#info' && current?.slug === entrySlug);
  }, [current?.slug, entrySlug, slug]);

  const play = useCallback(
    (item: FilmStageRailItem, at?: number) => {
      if (item.comingSoon) return;
      setSeekKey((key) => key + 1);
      openTheaterFromFilm({
        film: {
          id: item.id,
          name: item.name,
          slug: item.slug,
          mux_playback_id: item.muxPlaybackId,
          runtime: item.runtime,
          sponsor: item.sponsor,
          story_date: item.storyDate,
          location: item.location,
        },
        setSelectedFilm,
        setStartAt,
        setShowTheater,
        startAt: at,
      });
    },
    []
  );

  /** ⌘K / catalog title → `#play` opens theater on the film hero. */
  useEffect(() => {
    const consumePlayHash = () => {
      if (window.location.hash !== '#play') return;
      if (!current || current.comingSoon) return;
      play(current);
      window.history.replaceState(
        { filmSlug: current.slug },
        '',
        filmHref(current.slug, locale)
      );
    };
    consumePlayHash();
    window.addEventListener('hashchange', consumePlayHash);
    return () => window.removeEventListener('hashchange', consumePlayHash);
  }, [current, locale, play]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;
      if (event.key === 'Escape') {
        if (showTheater) return;
        if (infoOpen) {
          closeInfo();
          return;
        }
        return;
      }
      if (
        typing ||
        sheetOpen ||
        infoOpen ||
        showTheater ||
        document.body.dataset.fjorrOverlay
      )
        return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goRail(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goRail(1);
      } else if (event.key === ' ' || event.code === 'Space') {
        event.preventDefault();
        if (current) play(current);
      } else if (event.key.toLowerCase() === 'i') {
        event.preventDefault();
        openInfo();
      } else if (event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (rail.length < 2 || !current) return;
        let next = Math.floor(Math.random() * rail.length);
        if (rail[next]?.slug === current.slug) next = (next + 1) % rail.length;
        goTo(next);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    closeInfo,
    current,
    goRail,
    goTo,
    infoOpen,
    openInfo,
    play,
    rail,
    sheetOpen,
    showTheater,
  ]);

  const runShortcut = useCallback(
    (action: ShortcutAction) => {
      if (action === 'browse') {
        goRail(1);
        return;
      }
      if (action === 'shuffle') {
        if (rail.length < 2 || !current) return;
        let next = Math.floor(Math.random() * rail.length);
        if (rail[next]?.slug === current.slug) next = (next + 1) % rail.length;
        goTo(next);
        return;
      }
      if (action === 'play') {
        if (current) play(current);
        return;
      }
      if (action === 'info') {
        openInfo();
      }
    },
    [current, goRail, goTo, openInfo, play, rail]
  );

  useEffect(() => {
    setShortcutHandler(runShortcut);
    return () => setShortcutHandler(null);
  }, [runShortcut, setShortcutHandler]);

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-white text-[#0B0B0C]">
      <Navbar variant="light" />

      <div className={`relative min-h-0 flex-1 ${HOUSE_STAGE_SIDE_CLASS}`}>
        <div className="relative h-full w-full overflow-hidden rounded-[8px]">
        <HouseFrameNav
          onPrev={() => goRail(-1)}
          onNext={() => goRail(1)}
          enabled={rail.length > 1}
          visible={
            !sheetOpen && !infoOpen && !showTheater
          }
        />
        <div className="absolute inset-0 overflow-hidden">
        {rail.map((item, slide) => {
          const active = slide === index;
          const leaving = leavingRef.current === slide && !active;
          const shift = dir * 72;
          const x =
            phase === 'idle' || (!active && !leaving)
              ? 0
              : active
                ? phase === 'from'
                  ? shift
                  : 0
                : phase === 'from'
                  ? 0
                  : -shift;
          // Keep posters opaque — only slide. Extended bleed so a 72px nudge never gaps.
          const visible = active || leaving;
          const poster = heroSrc(item, frame);

          return (
            <article
              key={item.id}
              className={`absolute inset-y-0 ${
                active && phase !== 'from' ? 'z-10' : 'pointer-events-none'
              } ${phase === 'to' && (active || leaving) ? 'transition-transform duration-700 ease-out' : ''} ${
                active && !item.comingSoon ? 'cursor-pointer' : ''
              }`}
              style={{
                left: -72,
                right: -72,
                opacity: visible ? 1 : 0,
                transform: `translateX(${x}px)`,
                zIndex: active ? 10 : leaving ? 9 : 0,
              }}
              aria-hidden={!active}
              onClick={() => {
                if (!active || item.comingSoon) return;
                play(item);
              }}
            >
              <HouseHeroPreview
                key={`${item.id}-${frame}`}
                poster={poster}
                playbackId={item.comingSoon ? null : item.muxPlaybackId}
                runtime={item.runtime}
                active={active && phase !== 'from'}
                paused={previewPaused}
                priority={active && phase !== 'from'}
              />
            </article>
          );
        })}
        <HouseHeroCopy
          film={
            copyFilm
              ? {
                  id: copyFilm.id,
                  name: copyFilm.name,
                  slug: copyFilm.slug,
                  teaser: copyFilm.teaser,
                  sponsor: copyFilm.sponsor,
                  rating: copyFilm.rating,
                  location: copyFilm.location,
                  storyDate: copyFilm.storyDate,
                  runtime: copyFilm.runtime,
                  comingSoon: copyFilm.comingSoon,
                  titleArtCode: copyFilm.titleArtCode,
                  titleArtHex: copyFilm.titleArtHex,
                  titleArtScale: copyFilm.titleArtScale,
                  blokTall: copyFilm.blokTall,
                  heroTall: copyFilm.heroTall,
                }
              : null
          }
          visible={copyVisible && !infoOpen}
          titleAs="h2"
          onWatch={() => {
            if (copyFilm && !copyFilm.comingSoon) play(copyFilm);
          }}
          onInfo={openInfo}
        />


        {rail.length > 1 && !sheetOpen && !infoOpen ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center md:inset-x-auto md:bottom-5 md:right-5 md:justify-end">
            <HousePosterDots
              index={index}
              total={rail.length}
              onSelect={goTo}
            />
          </div>
        ) : null}

        </div>
        </div>
      </div>

      {!infoOpen && !searchOpen ? (
        <>
          {pinFooter ? (
            <div className="h-[54px] w-full shrink-0" aria-hidden />
          ) : null}
          <div
            className={
              pinFooter
                ? 'fixed inset-x-0 bottom-0 z-[60] bg-white'
                : 'relative z-50 w-full bg-white'
            }
          >
            <HouseFooter
              langOpen={isOpen('language')}
              shortcutsOpen={isOpen('shortcuts')}
              legalOpen={isOpen('legal')}
              onLanguage={() => {
                toggle('language');
              }}
              onShortcuts={() => {
                toggle('shortcuts');
              }}
              onLegal={() => {
                toggle('legal');
              }}
            />
          </div>
        </>
      ) : null}

      {infoOpen && current.slug === entrySlug ? (
        <ExhibitionSheet
          film={exhibition}
          onClose={closeInfo}
          onSeek={(seconds) => play(current, seconds)}
        />
      ) : null}

      {showTheater && selectedFilm ? (
        <CinemaTheater
          key={seekKey}
          film={selectedFilm}
          startAt={startAt}
          onTimeUpdate={(seconds: number) => {
            trackWatchProgress({
              filmId: selectedFilm.id || id,
              slug: selectedFilm.slug || current.slug,
              seconds,
              duration: selectedFilm.runtime ?? current.runtime,
            });
          }}
          onEnded={() => finishWatchProgress(selectedFilm.id || id)}
          onClose={() => {
            setShowTheater(false);
            setSelectedFilm(null);
            setStartAt(undefined);
          }}
        />
      ) : null}
    </div>
  );
}
