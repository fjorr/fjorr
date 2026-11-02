'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import { getPathname, useRouter } from '@/i18n/navigation';
import { type AppLocale } from '@/i18n/config';
import TheaterOpenShell from '@/components/TheaterOpenShell';
import Navbar from '@/components/Navbar';
import { openTheaterFromFilm } from '@/lib/theater-open';
import {
  finishWatchProgress,
  trackWatchProgress,
} from '@/lib/watch-progress';
import { Icon } from '@/components/ui/Icons';
import HouseFooter from '@/components/house/HouseFooter';
import { type ShortcutAction } from '@/components/house/ShortcutsPanel';
import HouseFrameNav from '@/components/house/HouseFrameNav';
import { useSwipeNav } from '@/lib/use-swipe-nav';
import HousePosterDots from '@/components/house/HousePosterDots';
import HouseHeroPreview from '@/components/house/HouseHeroPreview';
import HouseHeroCopy from '@/components/house/HouseHeroCopy';
import { useHeroCopyFade } from '@/components/house/useHeroCopyFade';
import ExhibitionSheet, {
  FilmArtifactRail,
  type ExhibitionFilm,
} from '@/components/house/ExhibitionSheet';

function scrollToFilmInfo() {
  const el = document.getElementById('film-info');
  if (!el) return;
  const top = el.getBoundingClientRect().top;
  if (top < 80 && window.scrollY > 40) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
import { useHouseOverlay } from '@/components/HouseOverlayProvider';
import {
  FILM_FRAME_CLASS,
  HOUSE_STAGE_SIDE_CLASS,
  HOUSE_STAGE_VERTICAL_CLASS,
  filmPosterWidthPx,
  houseStageVerticalPx,
} from '@/components/house/house-stage-margins';
import { useHouseStageBleed } from '@/components/house/use-house-stage-bleed';
import { storySettingDisplay } from '@/lib/story-year';
import RuntimeTag from '@/components/house/RuntimeTag';

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
  blokWide: string | null;
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

/** Vertical titled poster — same art as Browse. */
function tallPoster(item: FilmStageRailItem) {
  return item.blokTall || item.heroTall || item.heroClsx || item.blokWide || item.heroWide;
}

/** Same rule as the Browse cards: story year, then runtime. */
function railYear(item: FilmStageRailItem) {
  return storySettingDisplay(item.storyDate) || null;
}

function railRuntime(item: FilmStageRailItem) {
  return item.runtime ? `${Math.max(1, Math.ceil(item.runtime / 60))}m` : null;
}

function shuffleRail(items: FilmStageRailItem[]) {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const swap = next[i]!;
    next[i] = next[j]!;
    next[j] = swap;
  }
  return next;
}

function FilmEndRail({
  rail,
  index,
  onSelect,
}: {
  rail: FilmStageRailItem[];
  index: number;
  onSelect: (next: number) => void;
}) {
  const t = useTranslations('Film');
  const scrollerRef = useRef<HTMLDivElement>(null);
  const signature = rail.map((item) => item.slug).join('\0');
  const [order, setOrder] = useState<FilmStageRailItem[] | null>(null);
  const [edges, setEdges] = useState({ start: true, end: true });
  const currentSlug = rail[index]?.slug;

  useLayoutEffect(() => {
    setOrder(shuffleRail(rail));
    // Shuffle once per film set. `rail` is read from this render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !order) return;
    const sync = () => {
      setEdges({
        start: scroller.scrollLeft <= 2,
        end: scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 2,
      });
    };
    // Open on the middle of the row so posters bleed off both edges.
    scroller.scrollLeft = Math.max(0, (scroller.scrollWidth - scroller.clientWidth) / 2);
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, [order, currentSlug]);

  const shown = (order || []).filter((item) => item.slug !== currentSlug);
  if (!shown.length) return null;

  const slideBy = (dir: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const card = scroller.querySelector('button');
    const step = card
      ? card.getBoundingClientRect().width + 12
      : Math.round(scroller.clientWidth * 0.7);
    scroller.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <section className="w-full pb-6 pt-10 md:pt-12" aria-label="More films">
      <h2 className={`${FILM_FRAME_CLASS} mb-4 text-center font-[family-name:var(--font-circular-black)] text-[1.25rem] font-[900] leading-normal tracking-[-0.03em] text-[#0B0B0C]`}>
        More films
      </h2>
      <div className="relative">
        <div
          ref={scrollerRef}
          onScroll={() => {
            const scroller = scrollerRef.current;
            if (!scroller) return;
            const start = scroller.scrollLeft <= 2;
            const end =
              scroller.scrollLeft + scroller.clientWidth >=
              scroller.scrollWidth - 2;
            setEdges((prev) =>
              prev.start === start && prev.end === end ? prev : { start, end }
            );
          }}
          className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex w-max gap-3 px-6 pb-1 md:px-12">
            {shown.map((item) => {
              const src = tallPoster(item);
              const original = rail.findIndex((entry) => entry.slug === item.slug);
              const year = railYear(item);
              const runtime = item.comingSoon ? null : railRuntime(item);
              const comingSoon = item.comingSoon ? t('comingSoon') : null;
              const caption = [year, comingSoon || runtime].filter(Boolean).join(' · ');
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-label={caption ? `${item.name}, ${caption}` : item.name}
                  onClick={() => {
                    if (original < 0) return;
                    onSelect(original);
                  }}
                  className="w-[clamp(160px,17vw,220px)] shrink-0 text-left"
                >
                  <span className="block aspect-[2/3] overflow-hidden rounded-[8px] bg-[#F3F3F4]">
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={src}
                        alt=""
                        className="h-full w-full object-cover"
                        draggable={false}
                      />
                    ) : null}
                  </span>
                  {caption ? (
                    <span className="mt-2 flex min-w-0 items-center gap-1 font-sans text-[12px] font-medium leading-snug tracking-tight text-black/45">
                      {year ? <span className="truncate">{year}</span> : null}
                      {comingSoon ? (
                        <span className="ml-0.5 shrink-0 rounded-full border border-black/15 px-1.5 py-[3px] text-[10px] font-semibold leading-none text-black/60">
                          {comingSoon}
                        </span>
                      ) : runtime ? (
                        <>
                          {year ? <span aria-hidden>·</span> : null}
                          <RuntimeTag runtime={runtime} />
                        </>
                      ) : null}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
        <button
          type="button"
          aria-label={t('previousFilm')}
          disabled={edges.start}
          onClick={() => slideBy(-1)}
          className="absolute left-3 top-[calc(clamp(160px,17vw,220px)*0.75)] z-10 hidden -translate-y-1/2 md:block disabled:pointer-events-none disabled:opacity-30"
        >
          <Icon name="circleNavBack" className="!h-9 !w-9" aria-hidden />
        </button>
        <button
          type="button"
          aria-label={t('nextFilm')}
          disabled={edges.end}
          onClick={() => slideBy(1)}
          className="absolute right-3 top-[calc(clamp(160px,17vw,220px)*0.75)] z-10 hidden -translate-y-1/2 md:block disabled:pointer-events-none disabled:opacity-30"
        >
          <Icon name="circleNavForward" className="!h-9 !w-9" aria-hidden />
        </button>
      </div>
    </section>
  );
}

function heroSrc(item: FilmStageRailItem, frame: HeroFrame) {
  if (frame === 'wide') return item.heroWide || item.heroClsx || item.heroTall;
  if (frame === 'clsx') return item.heroClsx || item.heroWide || item.heroTall;
  return item.heroTall || item.heroClsx || item.heroWide;
}

function useHeroFrame(): HeroFrame {
  const [frame, setFrame] = useState<HeroFrame>('wide');
  useEffect(() => {
    const apply = () => {
      const width = filmPosterWidthPx(window.innerWidth);
      const vertical = houseStageVerticalPx(window.innerWidth);
      const aspect = width / Math.max(window.innerHeight - vertical * 2, 1);
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
  const pinFooter = sheetOpen;

  const rail = railProp.length ? railProp : [];
  const initialIndex = Math.max(
    0,
    rail.findIndex((item) => item.slug === slug)
  );

  const [index, setIndex] = useState(initialIndex);
  const [dir, setDir] = useState(1);
  const stageBleed = useHouseStageBleed();
  const [phase, setPhase] = useState<'idle' | 'from' | 'to'>('idle');
  const leavingRef = useRef<number | null>(null);
  const softNavRef = useRef(false);

  const [showTheater, setShowTheater] = useState(false);
  const [selectedFilm, setSelectedFilm] = useState<any>(null);
  const [startAt, setStartAt] = useState<number | undefined>(undefined);
  const [seekKey, setSeekKey] = useState(0);
  const current = rail[index] ?? rail[0];
  const [posterOff, setPosterOff] = useState(false);
  const posterFooterRef = useRef<HTMLDivElement>(null);
  const posterScrollCleanup = useRef<(() => void) | null>(null);
  const [exhibitionBySlug, setExhibitionBySlug] = useState<
    Record<string, ExhibitionFilm>
  >({});
  const previewPaused = sheetOpen || showTheater || posterOff;
  const { displayIndex: copyIndex, visible: copyVisible } = useHeroCopyFade(
    phase,
    index
  );
  const copyFilm = rail[copyIndex] ?? current;

  const entrySlug = slug;

  useEffect(() => {
    const apply = () => {
      const y = window.scrollY;
      setPosterOff(y > window.innerHeight * 0.55);
      const footer = posterFooterRef.current;
      if (!footer) return;
      if (pinFooter) {
        footer.style.opacity = '1';
        return;
      }
      footer.style.opacity = y > 16 ? '0' : '1';
    };
    apply();
    window.addEventListener('scroll', apply, { passive: true });
    return () => window.removeEventListener('scroll', apply);
  }, [pinFooter]);

  const bindPosterScroll = useCallback((node: HTMLDivElement | null) => {
    const previous = posterScrollCleanup.current;
    if (previous) {
      previous();
      posterScrollCleanup.current = null;
    }
    if (!node) return;
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
  }, []);

  useEffect(() => {
    return () => posterScrollCleanup.current?.();
  }, []);

  useEffect(() => {
    if (window.location.hash !== '#info') return;
    const timer = window.setTimeout(() => {
      document.getElementById('film-info')?.scrollIntoView({ block: 'start' });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [slug]);

  const syncUrl = useCallback(
    (nextSlug: string, hash = '') => {
      const path = filmHref(nextSlug, locale);
      softNavRef.current = true;
      const prev = window.history.state;
      const state =
        prev && typeof prev === 'object' && (prev.__NA || prev._N)
          ? { ...prev, filmSlug: nextSlug }
          : { filmSlug: nextSlug };
      window.history.pushState(state, '', `${path}${hash}`);
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
        // Back to the poster only when reading below it (More films). A poster swipe
        // drifts a few px vertically on phones; snapping then jolts the URL bar.
        if (window.scrollY > window.innerHeight * 0.5) window.scrollTo(0, 0);
        syncUrl(nextFilm.slug);
      }
    },
    [index, rail, syncUrl]
  );

  const goRail = useCallback((delta: number) => goTo(index + delta), [goTo, index]);

  const swipe = useSwipeNav({
    onPrev: () => goRail(-1),
    onNext: () => goRail(1),
    enabled: rail.length > 1 && !sheetOpen && !showTheater,
  });

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
      if (window.location.hash === '#info') {
        window.setTimeout(() => {
          document.getElementById('film-info')?.scrollIntoView({ block: 'start' });
        }, 0);
      } else {
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [index, rail]);

  useEffect(() => {
    const nextSlug = current?.slug;
    if (!nextSlug || nextSlug === entrySlug || exhibitionBySlug[nextSlug]) return;
    const controller = new AbortController();
    fetch(
      `/api/film-exhibition?slug=${encodeURIComponent(nextSlug)}&locale=${encodeURIComponent(locale)}`,
      { signal: controller.signal }
    )
      .then((response) => (response.ok ? response.json() : null))
      .then((data: ExhibitionFilm | null) => {
        if (!data?.name) return;
        setExhibitionBySlug((prev) =>
          prev[nextSlug] ? prev : { ...prev, [nextSlug]: data }
        );
      })
      .catch(() => {});
    return () => controller.abort();
  }, [current?.slug, entrySlug, exhibitionBySlug, locale]);

  const railKey = rail.map((item) => item.slug).join('\0');
  useEffect(() => {
    const start = Math.max(0, rail.findIndex((item) => item.slug === entrySlug));
    const queue: string[] = [];
    const seen = new Set<string>();
    for (let step = 1; step < rail.length; step += 1) {
      const ahead = rail[(start + step) % rail.length]?.slug;
      const behind = rail[(start - step + rail.length) % rail.length]?.slug;
      for (const nextSlug of [ahead, behind]) {
        if (!nextSlug || nextSlug === entrySlug || seen.has(nextSlug)) continue;
        seen.add(nextSlug);
        queue.push(nextSlug);
      }
    }
    if (!queue.length) return;
    const controller = new AbortController();
    let cursor = 0;
    const pump = async () => {
      while (cursor < queue.length) {
        const batch = queue.slice(cursor, cursor + 2);
        cursor += batch.length;
        await Promise.all(
          batch.map(async (nextSlug) => {
            try {
              const response = await fetch(
                `/api/film-exhibition?slug=${encodeURIComponent(nextSlug)}&locale=${encodeURIComponent(locale)}`,
                { signal: controller.signal }
              );
              if (!response.ok) return;
              const data = (await response.json()) as ExhibitionFilm | null;
              if (!data?.name) return;
              setExhibitionBySlug((prev) =>
                prev[nextSlug] ? prev : { ...prev, [nextSlug]: data }
              );
            } catch {
              /* Leave the swipe fetch to try again. */
            }
          })
        );
      }
    };
    void pump();
    return () => controller.abort();
  }, [railKey, entrySlug, locale, rail]);

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
      const prev = window.history.state;
      const state =
        prev && typeof prev === 'object' && (prev.__NA || prev._N)
          ? { ...prev, filmSlug: current.slug }
          : { filmSlug: current.slug };
      window.history.replaceState(state, '', filmHref(current.slug, locale));
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
        if (showTheater || sheetOpen) return;
        if (window.scrollY > 40) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }
      if (
        typing ||
        sheetOpen ||
        showTheater ||
        document.body.dataset.fjorrOverlay
      )
        return;
      const onPoster = window.scrollY < 80;
      if (event.key === 'ArrowLeft' && onPoster) {
        event.preventDefault();
        goRail(-1);
      } else if (event.key === 'ArrowRight' && onPoster) {
        event.preventDefault();
        goRail(1);
      } else if ((event.key === ' ' || event.code === 'Space') && onPoster) {
        event.preventDefault();
        if (current) play(current);
      } else if (event.key.toLowerCase() === 'i') {
        event.preventDefault();
        scrollToFilmInfo();
      } else if (event.key.toLowerCase() === 's' && onPoster) {
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
    current,
    goRail,
    goTo,
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
        scrollToFilmInfo();
      }
    },
    [current, goRail, goTo, play, rail]
  );

  useEffect(() => {
    setShortcutHandler(runShortcut);
    return () => setShortcutHandler(null);
  }, [runShortcut, setShortcutHandler]);

  if (!current) return null;

  const activeExhibition =
    current.slug === entrySlug
      ? exhibition
      : exhibitionBySlug[current.slug] || null;

  const stageFooter = () => (
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
    <div className="bg-white text-[#0B0B0C]">
      {/* svh, not dvh: dvh resizes the stage as the mobile URL bar moves mid-swipe. */}
      <div className="flex h-svh flex-col">
      <Navbar variant="dark" />

      <div className={`relative min-h-0 flex-1 ${HOUSE_STAGE_SIDE_CLASS} ${HOUSE_STAGE_VERTICAL_CLASS}`}>
        <div
          ref={bindPosterScroll}
          data-film-poster=""
          className="relative h-full w-full touch-pan-y rounded-[8px] [clip-path:inset(0_round_8px)]"
          {...swipe}
        >
        <HouseFrameNav
          onPrev={() => goRail(-1)}
          onNext={() => goRail(1)}
          enabled={rail.length > 1}
          visible={!sheetOpen && !showTheater}
        />
        <div className="absolute inset-0">
        {rail.map((item, slide) => {
          const active = slide === index;
          const leaving = leavingRef.current === slide && !active;
          const shift = dir * stageBleed;
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
                left: -stageBleed,
                right: -stageBleed,
                opacity: visible ? 1 : 0,
                transform: x ? `translateX(${x}px)` : undefined,
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
          visible={copyVisible}
          titleAs="h2"
          onWatch={() => {
            if (copyFilm && !copyFilm.comingSoon) play(copyFilm);
          }}
        />


        {rail.length > 1 && !sheetOpen ? (
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
        {stageFooter()}
      </div>
      </div>

      {activeExhibition?.artifacts.length ? (
        <FilmArtifactRail film={activeExhibition} />
      ) : null}

      <FilmEndRail rail={rail} index={index} onSelect={goTo} />

      {activeExhibition ? (
        <ExhibitionSheet
          film={activeExhibition}
          onSeek={(seconds) => play(current, seconds)}
        />
      ) : (
        <div id="film-info" className="scroll-mt-[54px]" />
      )}

      <div className="relative z-50 w-full bg-white">{stageFooter()}</div>

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
