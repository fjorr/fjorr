'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from '@/i18n/navigation';
import HouseFooter from '@/components/house/HouseFooter';
import { type ShortcutAction } from '@/components/house/ShortcutsPanel';
import HouseFrameNav from '@/components/house/HouseFrameNav';
import HousePosterDots from '@/components/house/HousePosterDots';
import HouseHeroPreview from '@/components/house/HouseHeroPreview';
import HouseHeroCopy from '@/components/house/HouseHeroCopy';
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
  houseStageSidePx,
} from '@/components/house/house-stage-margins';

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
  /** Synthetic house brand title card (always first on home). */
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

/** Stage chrome: fixed 54px nav + footer; side gutters match paper pages. */
const HOUSE_CHROME_PX = 54;

function marginsForViewport(width: number) {
  return {
    top: HOUSE_CHROME_PX,
    side: houseStageSidePx(width),
    bottom: HOUSE_CHROME_PX,
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

export default function HouseHome({ films }: { films: HouseFilm[] }) {
  const router = useRouter();
  const { active, setShortcutHandler, isOpen, toggle } =
    useHouseOverlay();
  const sheetOpen = active != null;
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [phase, setPhase] = useState<'idle' | 'from' | 'to'>('idle');
  const [showTheater, setShowTheater] = useState(false);
  const [selectedFilm, setSelectedFilm] = useState<TheaterFilmPayload | null>(null);
  const [startAt, setStartAt] = useState<number | undefined>(undefined);
  const leavingRef = useRef<number | null>(null);
  const frame = useHeroFrame();
  /** Permanent brand title card while the library grows. */
  const stageFilms = [HOUSE_INTRO_FILM, ...films];
  const previewPaused = sheetOpen || showTheater;
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

  const enterFromIntro = useCallback(() => {
    if (stageFilms.length > 1) goTo(1);
  }, [goTo, stageFilms.length]);

  const openFilm = useCallback((target: HouseFilm) => {
    if (!target.slug || isHouseIntroId(target.id) || target.kind === 'intro') return;
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

  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-white text-[#0B0B0C]">
      <Navbar variant="dark" />

      <div className={`relative min-h-0 flex-1 ${HOUSE_STAGE_SIDE_CLASS}`}>
        <div className="relative h-full w-full overflow-hidden rounded-[8px]">
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
          const shift = dir * 72;
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
                left: -72,
                right: -72,
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
              />
            </article>
          );
        })}
        <HouseHeroCopy
          film={
            copyFilm
              ? {
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
                }
              : null
          }
          visible={copyVisible}
          titleAs="h2"
          onWatch={() => {
            if (!copyFilm) return;
            if (copyFilm.kind === 'intro') {
              enterFromIntro();
              return;
            }
            if (!copyFilm.comingSoon) openFilm(copyFilm);
          }}
          infoHref={
            copyFilm?.kind === 'intro' || !copyFilm?.slug
              ? undefined
              : `/film/${copyFilm.slug}#info`
          }
        />
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
        </div>
      </div>

      <HouseFooter
        langOpen={isOpen('language')}
        intelOpen={isOpen('intel')}
        shortcutsOpen={isOpen('shortcuts')}
        legalOpen={isOpen('legal')}
        onLanguage={() => {
          toggle('language');
        }}
        onIntel={() => {
          toggle('intel');
        }}
        onShortcuts={() => {
          toggle('shortcuts');
        }}
        onLegal={() => {
          toggle('legal');
        }}
      />

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
