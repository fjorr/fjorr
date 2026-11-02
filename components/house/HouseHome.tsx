'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from '@/i18n/navigation';
import HouseFooter from '@/components/house/HouseFooter';
import { type ShortcutAction } from '@/components/house/ShortcutsPanel';
import HouseFrameNav from '@/components/house/HouseFrameNav';
import { useSwipeNav } from '@/lib/use-swipe-nav';
import HousePosterDots from '@/components/house/HousePosterDots';
import HouseHeroPreview from '@/components/house/HouseHeroPreview';
import HouseHeroCopy from '@/components/house/HouseHeroCopy';
import HomeBrowse from '@/components/house/HomeBrowse';
import { useHeroCopyFade } from '@/components/house/useHeroCopyFade';
import TheaterOpenShell from '@/components/TheaterOpenShell';
import Navbar from '@/components/Navbar';
import { useHouseOverlay } from '@/components/HouseOverlayProvider';
import { openTheaterFromFilm, type TheaterFilmPayload } from '@/lib/theater-open';
import {
  AMBIENT_INTRO_ID,
  isHouseIntroId,
} from '@/lib/house-intro';
import {
  finishWatchProgress,
  trackWatchProgress,
} from '@/lib/watch-progress';
import {
  HOUSE_STAGE_SIDE_CLASS,
  HOUSE_STAGE_VERTICAL_CLASS,
  houseStageSidePx,
  houseStageVerticalPx,
} from '@/components/house/house-stage-margins';
import { useHouseStageBleed } from '@/components/house/use-house-stage-bleed';

const CinemaTheater = dynamic(() => import('@/components/CinemaTheater'), {
  ssr: false,
  loading: () => <TheaterOpenShell />,
});

export type HouseFilm = {
  id: string;
  name?: string | null;
  slug: string;
  mux_playback_id?: string | null;
  hero_wide?: string | null;
  hero_clsx?: string | null;
  hero_tall?: string | null;
  blok_tall?: string | null;
  blok_ogrf?: string | null;
  teaser?: string | null;
  story_date?: string | null;
  location?: string | null;
  runtime?: number | null;
  release_date?: string | null;
  comingSoon?: boolean;
  sponsor?: string | null;
  title_art_code?: string | null;
  title_art_hex?: string | null;
  title_art_scale?: number | null;
  rating?: string | null;
  theme?: string | null;
  /** Synthetic house card. Intro is first on home. Slate sits among the films. */
  kind?: 'intro';
};

const HOUSE_INTRO_FILM: HouseFilm = {
  id: AMBIENT_INTRO_ID,
  slug: '__intro__',
  kind: 'intro',
  name: null,
  teaser: null,
  hero_wide: null,
  hero_clsx: null,
  hero_tall: null,
  blok_ogrf: null,
  mux_playback_id: null,
  comingSoon: false,
};

function marginsForViewport(width: number) {
  return {
    top: houseStageVerticalPx(width),
    side: houseStageSidePx(width),
    bottom: houseStageVerticalPx(width),
  };
}

type HeroFrame = 'wide' | 'clsx' | 'tall';

function useHeroFrame(): HeroFrame {
  const [frame, setFrame] = useState<HeroFrame>('wide');

  useEffect(() => {
    const apply = () => {
      const margin = marginsForViewport(window.innerWidth);
      const width = window.innerWidth - margin.side * 2;
      const height = window.innerHeight - margin.top - margin.bottom;
      const aspect = width / Math.max(height, 1);
      setFrame(aspect >= 1.5 ? 'wide' : aspect >= 0.75 ? 'clsx' : 'tall');
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);

  return frame;
}

function heroSrc(item: HouseFilm, frame: HeroFrame) {
  if (frame === 'wide') return item.hero_wide || item.hero_clsx || item.hero_tall || null;
  if (frame === 'clsx') return item.hero_clsx || item.hero_wide || item.hero_tall || null;
  return item.hero_tall || item.hero_clsx || item.hero_wide || null;
}

export default function HouseHome({
  films,
  browse = false,
  cornerChip = null,
  includeIntro = true,
  emptyMessage = null,
}: {
  films: HouseFilm[];
  /**
   * Browse under the hero (home). The hero becomes the first screen of a
   * scrolling page instead of a fixed stage.
   */
  browse?: boolean;
  /** Quiet label upper-left on the poster (e.g. early release). */
  cornerChip?: string | null;
  /** Home keeps the brand intro card; other stages can omit it. */
  includeIntro?: boolean;
  /** Shown in the stage when there are no films (and no intro). */
  emptyMessage?: string | null;
}) {
  const router = useRouter();
  const { active, setShortcutHandler, isOpen, toggle } =
    useHouseOverlay();
  const sheetOpen = active != null;
  const pinFooter = sheetOpen;
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const stageBleed = useHouseStageBleed();
  const [phase, setPhase] = useState<'idle' | 'from' | 'to'>('idle');
  const [showTheater, setShowTheater] = useState(false);
  const [selectedFilm, setSelectedFilm] = useState<TheaterFilmPayload | null>(null);
  const [startAt, setStartAt] = useState<number | undefined>(undefined);
  const leavingRef = useRef<number | null>(null);
  const posterScrollCleanup = useRef<(() => void) | null>(null);
  const posterFooterRef = useRef<HTMLDivElement>(null);
  const [posterOff, setPosterOff] = useState(false);
  const frame = useHeroFrame();
  const scrolls = browse;
  /** Permanent brand title card while the library grows. */
  const stageFilms = includeIntro ? [HOUSE_INTRO_FILM, ...films] : films;
  const isEmptyStage = stageFilms.length === 0;
  const previewPaused = sheetOpen || showTheater || posterOff;

  useEffect(() => {
    if (!scrolls) return;
    const apply = () => {
      const y = window.scrollY;
      setPosterOff(y > window.innerHeight * 0.55);
      const footer = posterFooterRef.current;
      if (!footer) return;
      footer.style.opacity = pinFooter || y <= 16 ? '1' : '0';
    };
    apply();
    window.addEventListener('scroll', apply, { passive: true });
    return () => window.removeEventListener('scroll', apply);
  }, [pinFooter, scrolls]);

  const bindPosterScroll = useCallback(
    (node: HTMLDivElement | null) => {
      posterScrollCleanup.current?.();
      posterScrollCleanup.current = null;
      if (!node || !scrolls) return;
      const onWheel = (event: WheelEvent) => {
        if (event.ctrlKey || !node.contains(event.target as Node)) return;
        let dy = event.deltaY;
        if (event.deltaMode === 1) dy *= 16;
        else if (event.deltaMode === 2) dy *= window.innerHeight;
        if (!dy || Math.abs(event.deltaX) > Math.abs(dy) * 1.5) return;
        if (event.cancelable) event.preventDefault();
        const scroller = document.scrollingElement;
        if (!scroller) return;
        scroller.scrollTop += dy;
      };
      node.addEventListener('wheel', onWheel, { capture: true, passive: false });
      posterScrollCleanup.current = () => {
        node.removeEventListener('wheel', onWheel, { capture: true });
      };
    },
    [scrolls]
  );

  useEffect(() => {
    return () => posterScrollCleanup.current?.();
  }, []);
  const { displayIndex: copyIndex, visible: copyVisible } = useHeroCopyFade(
    phase,
    index
  );
  const copyFilm = stageFilms[copyIndex] ?? stageFilms[index] ?? null;

  const goTo = useCallback(
    (next: number) => {
      if (!stageFilms.length) return;
      const wrapped = ((next % stageFilms.length) + stageFilms.length) % stageFilms.length;
      if (wrapped === index) return;
      let delta = wrapped - index;
      if (delta > stageFilms.length / 2) delta -= stageFilms.length;
      if (delta < -stageFilms.length / 2) delta += stageFilms.length;
      leavingRef.current = index;
      setDir(delta >= 0 ? 1 : -1);
      setPhase('from');
      setIndex(wrapped);
    },
    [stageFilms.length, index]
  );

  const swipe = useSwipeNav({
    onPrev: () => goTo(index - 1),
    onNext: () => goTo(index + 1),
    enabled: stageFilms.length > 1 && !sheetOpen && !showTheater,
  });

  const enterFromIntro = useCallback(() => {
    if (stageFilms.length > 1) goTo(1);
  }, [goTo, stageFilms.length]);

  const openFilm = useCallback((target: HouseFilm) => {
    if (
      !target.slug ||
      isHouseIntroId(target.id) ||
      target.kind === 'intro'
    ) {
      return;
    }
    openTheaterFromFilm({
      film: {
        id: target.id,
        name: target.name,
        slug: target.slug,
        mux_playback_id: target.mux_playback_id,
        story_date: target.story_date,
        runtime: target.runtime,
        last_line: null,
        location: target.location ?? null,
        sponsor: target.sponsor,
      },
      setSelectedFilm,
      setStartAt,
      setShowTheater,
    });
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;
      if (event.key === 'Escape') {
        if (showTheater) return;
        return;
      }
      if (typing || sheetOpen || showTheater) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goTo(index - 1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goTo(index + 1);
      } else if (event.key === ' ' || event.code === 'Space') {
        event.preventDefault();
        const film = stageFilms[index];
        if (!film) return;
        if (film.kind === 'intro') {
          enterFromIntro();
          return;
        }
        if (!film.comingSoon) openFilm(film);
      } else if (event.key.toLowerCase() === 'i') {
        event.preventDefault();
        const film = stageFilms[index];
        if (!film || film.kind === 'intro') return;
        if (film.slug) router.push(`/film/${film.slug}#info`);
      } else if (event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (stageFilms.length < 2) return;
        let next = Math.floor(Math.random() * stageFilms.length);
        if (next === index) next = (next + 1) % stageFilms.length;
        goTo(next);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    enterFromIntro,
    goTo,
    index,
    openFilm,
    router,
    sheetOpen,
    showTheater,
    stageFilms,
  ]);

  const runShortcut = useCallback(
    (action: ShortcutAction) => {
      const film = stageFilms[index];
      if (action === 'browse') {
        goTo(index + 1);
        return;
      }
      if (action === 'shuffle') {
        if (stageFilms.length < 2) return;
        let next = Math.floor(Math.random() * stageFilms.length);
        if (next === index) next = (next + 1) % stageFilms.length;
        goTo(next);
        return;
      }
      if (action === 'play') {
        if (!film) return;
        if (film.kind === 'intro') {
          enterFromIntro();
          return;
        }
        if (!film.comingSoon) openFilm(film);
        return;
      }
      if (action === 'info') {
        if (!film || film.kind === 'intro') return;
        if (film.slug) router.push(`/film/${film.slug}#info`);
      }
    },
    [enterFromIntro, goTo, index, openFilm, router, stageFilms]
  );

  useEffect(() => {
    setShortcutHandler(runShortcut);
    return () => setShortcutHandler(null);
  }, [runShortcut, setShortcutHandler]);

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

  const handleTimeUpdate = useCallback(
    (seconds: number) => {
      if (!selectedFilm?.id || !selectedFilm.slug) return;
      trackWatchProgress({
        filmId: selectedFilm.id,
        slug: selectedFilm.slug,
        seconds,
        duration: selectedFilm.runtime,
      });
    },
    [selectedFilm]
  );

  const footer = (
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
  );

  return (
    <div
      className={
        scrolls
          ? 'bg-white text-[#0B0B0C]'
          : 'fixed inset-0 z-40 flex flex-col overflow-clip bg-white text-[#0B0B0C]'
      }
    >
      <div className={scrolls ? 'flex h-dvh flex-col' : 'contents'}>
      <Navbar variant="dark" />

      <div className={`relative min-h-0 flex-1 ${HOUSE_STAGE_SIDE_CLASS} ${HOUSE_STAGE_VERTICAL_CLASS}`}>
        <div
          ref={bindPosterScroll}
          className="relative h-full w-full touch-pan-y overflow-clip rounded-[8px]"
          {...swipe}
        >
        {isEmptyStage ? (
          <div className="flex h-full w-full items-center justify-center bg-[#0B0B0C] px-8">
            <p className="m-0 max-w-[32ch] text-center font-sans text-[16px] font-medium leading-relaxed text-white/55">
              {emptyMessage || '\u00a0'}
            </p>
          </div>
        ) : (
          <>
        <HouseFrameNav
          onPrev={() => goTo(index - 1)}
          onNext={() => goTo(index + 1)}
          enabled={stageFilms.length > 1}
          visible={!sheetOpen && !showTheater}
        />
        <div className="absolute inset-0 overflow-hidden">
        {stageFilms.map((item, slide) => {
          const active = slide === index;
          const leaving = leavingRef.current === slide && !active;
          const shift = dir * stageBleed;
          const x = phase === 'idle' || (!active && !leaving)
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
          const isIntro = item.kind === 'intro';

          return (
            <article
              key={item.id}
              className={`absolute inset-y-0 ${
                active && phase !== 'from' ? 'z-10' : 'pointer-events-none'
              } ${phase === 'to' && (active || leaving) ? 'transition-transform duration-700 ease-out' : ''} ${
                active && (isIntro || !item.comingSoon) ? 'cursor-pointer' : ''
              }`}
              style={{
                left: -stageBleed,
                right: -stageBleed,
                opacity: visible ? 1 : 0,
                transform: `translateX(${x}px)`,
                zIndex: active ? 10 : leaving ? 9 : 0,
              }}
              aria-hidden={!active}
              onClick={() => {
                if (!active) return;
                if (isIntro) {
                  enterFromIntro();
                  return;
                }
                if (item.comingSoon) return;
                openFilm(item);
              }}
            >
              <HouseHeroPreview
                key={`${item.id}-${frame}`}
                poster={poster}
                playbackId={isIntro || item.comingSoon ? null : item.mux_playback_id}
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
                  storyDate: copyFilm.story_date,
                  runtime: copyFilm.runtime,
                  comingSoon: copyFilm.comingSoon,
                  kind: copyFilm.kind,
                  titleArtCode: copyFilm.title_art_code,
                  titleArtHex: copyFilm.title_art_hex,
                  titleArtScale: copyFilm.title_art_scale,
                  blokTall: copyFilm.blok_tall ?? null,
                  heroTall: copyFilm.hero_tall ?? null,
                }
              : null
          }
          visible={copyVisible}
          titleAs="h2"
          showVoyageurChip={!cornerChip}
          showSend={!cornerChip}
          onWatch={() => {
            if (!copyFilm) return;
            if (copyFilm.kind === 'intro') {
              enterFromIntro();
              return;
            }
            if (!copyFilm.comingSoon) openFilm(copyFilm);
          }}
        />
        {cornerChip ? (
          <div className="pointer-events-none absolute left-6 top-6 z-20 rounded-[6px] bg-[#FF385C] px-2.5 py-1 font-sans text-[12px] font-semibold tracking-normal text-white">
            {cornerChip}
          </div>
        ) : null}
        {stageFilms.length > 1 && !sheetOpen ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center md:inset-x-auto md:bottom-5 md:right-5 md:justify-end">
            <HousePosterDots
              index={index}
              total={stageFilms.length}
              onSelect={goTo}
            />
          </div>
        ) : null}
        </div>
          </>
        )}
        </div>
      </div>

      {pinFooter ? (
        <div className="h-[54px] w-full shrink-0" aria-hidden />
      ) : null}
      <div
        ref={posterFooterRef}
        className={
          pinFooter
            ? 'fixed inset-x-0 bottom-0 z-[60] bg-white'
            : 'relative z-50 w-full shrink-0 bg-white transition-opacity duration-200'
        }
      >
        {footer}
      </div>
      </div>

      {scrolls ? <HomeBrowse /> : null}
      {scrolls ? (
        <div className="relative z-50 w-full bg-white">{footer}</div>
      ) : null}

      {showTheater && selectedFilm ? (
        <CinemaTheater
          film={{
            id: selectedFilm.id,
            name: selectedFilm.name ?? '',
            slug: selectedFilm.slug,
            mux_playback_id: selectedFilm.mux_playback_id ?? null,
            last_line: selectedFilm.last_line ?? null,
            last_line_attribution: selectedFilm.last_line_attribution ?? null,
            story_date: selectedFilm.story_date ?? null,
            location: selectedFilm.location ?? null,
            teaser: null,
            runtime: selectedFilm.runtime ?? null,
            language_subtitle: selectedFilm.language_subtitle,
          }}
          startAt={startAt}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => {
            if (selectedFilm.id) finishWatchProgress(selectedFilm.id);
          }}
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
