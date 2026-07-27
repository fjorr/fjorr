'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { useRouter } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { parseLocale, localeLabels, locales, type AppLocale } from '@/i18n/config';
import { absoluteUrl } from '@/lib/site';
import { useTheaterHls } from '@/lib/theater/use-theater-hls';
import { useTheaterCaptions } from '@/lib/theater/use-theater-captions';
import { useTheaterChrome } from '@/lib/theater/use-theater-chrome';
import TheaterScrubber from '@/components/TheaterScrubber';
import TheaterCircleControl, {
  THEATER_CIRCLE_CIRCUMFERENCE,
} from '@/components/TheaterCircleControl';
import TheaterRamsChrome, { TheaterRamsIdentity } from '@/components/TheaterRamsChrome';
import TheaterFilmStrip, {
  paintFilmStrip,
  type FilmStripMeta,
} from '@/components/TheaterFilmStrip';
import {
  THEATER_PLAYER_CHROME,
  resolveRamsChromeLayout,
  type RamsChromeLayout,
} from '@/lib/theater/player-chrome-variant';
import { useMuxStoryboard } from '@/lib/theater/use-mux-storyboard';
import { useColorScheme } from '@/components/ColorSchemeProvider';
import { LIGHT_PAGE_BG, LIGHT_PAGE_FG } from '@/lib/color-scheme';

const isCircleChrome = THEATER_PLAYER_CHROME === 'circle';
const isRamsChrome = THEATER_PLAYER_CHROME === 'rams';

const FilmSendSheet = dynamic(() => import('@/components/FilmSendSheet'), { ssr: false });

interface CinemaTheaterProps {
  film: {
    id: any;
    name: any;
    slug: any;
    mux_playback_id: any;
    last_line: any;
    story_date: any;
    location: any;
    teaser?: string | null;
    runtime?: number | null;
    blok_tall?: string | null;
    hero_tall?: string | null;
    language_subtitle?: {
      code: string;
      name: string;
      vtt_url: string;
    }[];
  };
  onClose: () => void;
  backUrl?: string;
  startAt?: number;
  seekTo?: number | null;
  onSeekHandled?: () => void;
  onTimeUpdate?: (seconds: number) => void;
  onEnded?: () => void;
  mode?: 'theater' | 'embed';
}

function formatTime(time: number) {
  if (isNaN(time)) return '0:00';
  const m = Math.floor(time / 60);
  const s = Math.floor(Math.abs(time % 60))
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

/** Rams timecode — fixed-width, zero-padded, no flourish. */
function formatTimecode(time: number) {
  if (isNaN(time)) return '00:00';
  const total = Math.max(0, Math.floor(Math.abs(time)));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Prefer native endonym so viewers recognize their language without ISO codes. */
function captionLangLabel(code: string, fallbackName?: string) {
  const c = code.toLowerCase().trim() as AppLocale;
  return localeLabels[c] || fallbackName?.trim() || code.toUpperCase();
}

/**
 * Always list every site locale for caption UI testing.
 * Real VTT rows win when present; missing ones still appear as selectable chips.
 */
function captionMenuItems(
  tracks: { code: string; name: string; vtt_url: string }[]
): { code: string; name: string; available: boolean }[] {
  const byCode = new Map(
    tracks
      .map((t) => {
        const code = (t.code || '').trim().toLowerCase();
        if (!code) return null;
        return [code, t] as const;
      })
      .filter(Boolean) as [string, { code: string; name: string; vtt_url: string }][]
  );

  return locales.map((code) => {
    const track = byCode.get(code);
    return {
      code,
      name: captionLangLabel(code, track?.name),
      available: Boolean(track?.vtt_url),
    };
  });
}

export default function CinemaTheater({
  film,
  onClose,
  backUrl,
  startAt,
  seekTo = null,
  onSeekHandled,
  onTimeUpdate,
  onEnded,
  mode = 'theater',
}: CinemaTheaterProps) {
  const router = useRouter();
  const locale = parseLocale(useLocale());
  const t = useTranslations('Theater');
  const ramsLayout: RamsChromeLayout = resolveRamsChromeLayout(
    film?.slug,
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('rams')
      : null
  );
  const tNav = useTranslations('Nav');
  const { isLight } = useColorScheme();
  const isEmbed = mode === 'embed';
  const iconInvert = isLight ? '' : 'invert';
  const chromeInk = isLight ? 'text-[#0B0B0C]' : 'text-white';
  const chromeMuted = isLight ? 'text-[#0B0B0C]/80' : 'text-white/80';
  const chromeFg = isLight ? LIGHT_PAGE_FG : '#F5F5F7';
  const shellBg = isLight ? LIGHT_PAGE_BG : '#000000';

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);

  const skipBumper = isEmbed || (typeof startAt === 'number' && startAt > 0);
  const [isPlayingLogo, setIsPlayingLogo] = useState(!skipBumper);
  const LOGO_SOURCE =
    'https://media.fjorr.com/assets/studio-logo/fjorr-studio-logo-04.mp4';
  const didApplyStartAtRef = useRef(false);

  const watchOnFjorrUrl = `${absoluteUrl(`/film/${film?.slug}`)}?utm_source=embed&utm_medium=iframe&utm_campaign=${encodeURIComponent(String(film?.slug || ''))}`;

  const [cachedSubtitles, setCachedSubtitles] = useState(film?.language_subtitle || []);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const filmPlayerRef = useRef<HTMLVideoElement | null>(null);
  const logoPlayerRef = useRef<HTMLVideoElement | null>(null);
  const [filmMediaEl, setFilmMediaEl] = useState<HTMLVideoElement | null>(null);
  const [logoMediaEl, setLogoMediaEl] = useState<HTMLVideoElement | null>(null);
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);

  const bindContainer = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
    setContainerEl(node);
  }, []);

  const bindFilmPlayer = useCallback((node: HTMLVideoElement | null) => {
    filmPlayerRef.current = node;
    setFilmMediaEl(node);
  }, []);

  const bindLogoPlayer = useCallback((node: HTMLVideoElement | null) => {
    logoPlayerRef.current = node;
    setLogoMediaEl(node);
  }, []);

  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);
  const isPlayingRef = useRef(false);
  const isScrubbingRef = useRef(false);
  const lastParentTimePushRef = useRef(0);

  const playheadRef = useRef<HTMLDivElement | null>(null);
  const scrubberRef = useRef<HTMLInputElement | null>(null);
  const scrubTimeRef = useRef<HTMLSpanElement | null>(null);
  const circleProgressRef = useRef<SVGCircleElement | null>(null);
  const elapsedTimeRef = useRef<HTMLSpanElement | null>(null);
  const durationTimeRef = useRef<HTMLSpanElement | null>(null);
  const stripRailRef = useRef<HTMLDivElement | null>(null);
  const stripMetaRef = useRef<FilmStripMeta | null>(null);
  const ccScrollRef = useRef<HTMLDivElement | null>(null);
  const [ccCanScrollLeft, setCcCanScrollLeft] = useState(false);
  const [ccCanScrollRight, setCcCanScrollRight] = useState(false);

  const updateCcScrollHints = useCallback(() => {
    const root = ccScrollRef.current;
    if (!root) {
      setCcCanScrollLeft(false);
      setCcCanScrollRight(false);
      return;
    }
    const max = root.scrollWidth - root.clientWidth;
    setCcCanScrollLeft(root.scrollLeft > 2);
    setCcCanScrollRight(max > 2 && root.scrollLeft < max - 2);
  }, []);

  const scrollCcStrip = useCallback(
    (direction: -1 | 1) => {
      const root = ccScrollRef.current;
      if (!root) return;
      root.scrollBy({ left: direction * Math.max(120, root.clientWidth * 0.55), behavior: 'smooth' });
    },
    []
  );

  isPlayingRef.current = isPlaying;
  isScrubbingRef.current = isScrubbing;

  const playbackId =
    film?.mux_playback_id || (film as any)?.playback_id || (film as any)?.mux_id || null;

  // Stabilize fatal handler — inline lambdas from parent must not re-attach HLS.
  const onFatalErrorStable = useCallback(() => setIsLoading(false), []);

  const { isMediaReady } = useTheaterHls({
    mediaElement: filmMediaEl,
    playbackId,
    preloadOnly: isPlayingLogo,
    isMuted,
    filmTitle: film?.name,
    onFatalError: onFatalErrorStable,
  });

  const { storyboard } = useMuxStoryboard(
    isRamsChrome && ramsLayout === 'strip' ? playbackId : null
  );

  const tracks = cachedSubtitles.length > 0 ? cachedSubtitles : film?.language_subtitle || [];

  const {
    selectedLangCode,
    currentSubtitleText,
    showCCMenu,
    setShowCCMenu,
    selectLanguage,
    syncCueToTime,
  } = useTheaterCaptions({
    tracks,
    locale,
    enableAutoSelect: !isPlayingLogo,
    currentTimeRef,
    isPlayingRef,
  });

  const paintProgress = useCallback((time: number, duration: number) => {
    const ratio = duration > 0 ? Math.min(1, Math.max(0, time / duration)) : 0;
    const pct = ratio * 100;
    if (playheadRef.current) playheadRef.current.style.left = `${pct}%`;
    if (scrubberRef.current && document.activeElement !== scrubberRef.current) {
      scrubberRef.current.value = String(time);
    }
    if (scrubTimeRef.current) scrubTimeRef.current.textContent = formatTime(time);
    if (circleProgressRef.current) {
      circleProgressRef.current.style.strokeDashoffset = String(
        THEATER_CIRCLE_CIRCUMFERENCE * (1 - ratio)
      );
    }
    const clock = isRamsChrome ? formatTimecode : formatTime;
    if (elapsedTimeRef.current) elapsedTimeRef.current.textContent = clock(time);
    if (durationTimeRef.current) durationTimeRef.current.textContent = clock(duration || 0);
    // Strip only pans while scrubbing — playback-driven motion reads too choppy.
    if (isScrubbingRef.current) {
      paintFilmStrip(stripRailRef.current, stripMetaRef.current, ratio);
    }
  }, []);

  const paintTimeUi = useCallback(() => {
    if (isScrubbingRef.current) return;
    paintProgress(currentTimeRef.current, durationRef.current);
  }, [paintProgress]);

  useEffect(() => {
    if (!storyboard) return;
    paintTimeUi();
  }, [storyboard, paintTimeUi]);

  // rAF clock while playing — avoids React re-renders every timeupdate.
  useEffect(() => {
    if (!isPlaying || isPlayingLogo) return;
    let raf = 0;
    const loop = () => {
      paintTimeUi();
      syncCueToTime();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, isPlayingLogo, paintTimeUi, syncCueToTime]);

  const handleCloseNavigation = useCallback(() => {
    if (isEmbed) {
      window.open(watchOnFjorrUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (backUrl) router.push(backUrl);
    else onClose();
  }, [isEmbed, watchOnFjorrUrl, backUrl, router, onClose]);

  const setControlsVisibleRef = useRef<(visible: boolean) => void>(() => {});
  const stripMenuOpenRef = useRef(false);

  const togglePlay = useCallback(() => {
    const player = isPlayingLogo ? logoPlayerRef.current : filmPlayerRef.current;
    if (!player) return;
    // Strip menu: Play dismisses chrome and resumes the full player immediately.
    if (stripMenuOpenRef.current && player.paused) {
      void player.play().catch(() => {});
      setControlsVisibleRef.current(false);
      return;
    }
    if (isPlaying) player.pause();
    else void player.play().catch(() => {});
  }, [isPlaying, isPlayingLogo]);

  const toggleMute = useCallback(() => {
    const next = !isMuted;
    if (logoPlayerRef.current) logoPlayerRef.current.muted = next;
    if (filmPlayerRef.current) filmPlayerRef.current.muted = next;
    setIsMuted(next);
  }, [isMuted]);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    const activeVideo = isPlayingLogo ? logoPlayerRef.current : filmPlayerRef.current;
    if (!container || !activeVideo) return;

    const isMobileSafari =
      /iPhone|iPod/.test(navigator.userAgent) && !(document as any).requestFullscreen;

    const doc = document as Document & {
      webkitFullscreenElement?: Element;
      webkitExitFullscreen?: () => void;
    };

    if (
      !document.fullscreenElement &&
      !doc.webkitFullscreenElement &&
      !(activeVideo as any).webkitDisplayingFullscreen
    ) {
      if (isMobileSafari && (activeVideo as any).webkitEnterFullscreen) {
        (activeVideo as any).webkitEnterFullscreen();
      } else if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {});
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
      }
    } else if (isMobileSafari && (activeVideo as any).webkitExitFullscreen) {
      (activeVideo as any).webkitExitFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if (doc.webkitExitFullscreen) {
      doc.webkitExitFullscreen();
    }
  }, [isPlayingLogo]);

  const seekBy = useCallback((delta: number) => {
    const player = filmPlayerRef.current;
    if (!player || isPlayingLogo) return;
    const next = Math.min(
      durationRef.current || player.duration || 0,
      Math.max(0, currentTimeRef.current + delta)
    );
    player.currentTime = next;
    currentTimeRef.current = next;
    paintTimeUi();
    syncCueToTime();
  }, [isPlayingLogo, paintTimeUi, syncCueToTime]);

  const { controlsVisible, isFullscreen, showUIControls, setControlsVisible } = useTheaterChrome({
    containerEl,
    filmPlayerRef,
    logoPlayerRef,
    isPlayingLogo,
    isPlaying,
    isEmbed,
    showCCMenu,
    isScrubbing,
    chassisMode: isRamsChrome,
    onTogglePlay: togglePlay,
    onToggleMute: toggleMute,
    onToggleFullscreen: toggleFullscreen,
    onToggleCaptionsMenu: () => setShowCCMenu((v) => !v),
    onSeekBy: seekBy,
    onClose: handleCloseNavigation,
  });
  setControlsVisibleRef.current = setControlsVisible;

  /** Rams chrome visible — drives overlay dim / plaque crossfade. */
  const ramsChromeUp =
    isRamsChrome && controlsVisible && !isPlayingLogo && !isEmbed;
  stripMenuOpenRef.current = ramsLayout === 'strip' && ramsChromeUp;

  /** Plaque/strip compact mode after mid-fade swap — layout snaps while opacity is 0. */
  const [ramsPlaqueMode, setRamsPlaqueMode] = useState(false);
  const [ramsStageHidden, setRamsStageHidden] = useState(false);
  const ramsUsesCompact = ramsLayout === 'plaque' || ramsLayout === 'strip';

  useEffect(() => {
    if (!isRamsChrome || !ramsUsesCompact) {
      setRamsPlaqueMode(false);
      setRamsStageHidden(false);
      return;
    }
    if (ramsChromeUp === ramsPlaqueMode) return;
    // Strip → full player: snap open immediately (Play dismisses the menu).
    if (ramsLayout === 'strip' && !ramsChromeUp) {
      setRamsStageHidden(false);
      setRamsPlaqueMode(false);
      return;
    }
    setRamsStageHidden(true);
    const timer = window.setTimeout(() => {
      setRamsPlaqueMode(ramsChromeUp);
      setRamsStageHidden(false);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [isRamsChrome, ramsUsesCompact, ramsLayout, ramsChromeUp, ramsPlaqueMode]);

  // Strip: pause whenever the menu is up — strip is a still scrubber, not a live viewer.
  useEffect(() => {
    if (ramsLayout !== 'strip' || !ramsChromeUp) return;
    const player = filmPlayerRef.current;
    if (player && !player.paused) player.pause();
  }, [ramsLayout, ramsChromeUp]);

  // Pin strip + clock once when the rail appears (no playback-driven pan).
  useEffect(() => {
    if (ramsLayout !== 'strip' || !ramsPlaqueMode) return;
    const duration = durationRef.current;
    const time = currentTimeRef.current;
    const ratio = duration > 0 ? Math.min(1, Math.max(0, time / duration)) : 0;
    paintFilmStrip(stripRailRef.current, stripMetaRef.current, ratio);
    if (elapsedTimeRef.current) elapsedTimeRef.current.textContent = formatTimecode(time);
    if (scrubberRef.current && document.activeElement !== scrubberRef.current) {
      scrubberRef.current.value = String(time);
    }
  }, [ramsLayout, ramsPlaqueMode, storyboard]);

  useEffect(() => {
    if (isEmbed) return;
    window.dispatchEvent(new CustomEvent('fjorr_hide_main_navbar'));
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyHeight = document.body.style.height;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100svh';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      window.dispatchEvent(new CustomEvent('fjorr_show_main_navbar'));
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.height = originalBodyHeight;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [isEmbed]);

  useEffect(() => {
    if (film?.language_subtitle?.length) {
      setCachedSubtitles(film.language_subtitle);
    }
  }, [film?.id, film?.language_subtitle]);

  useEffect(() => {
    if (isMediaReady && !isPlayingLogo) setIsLoading(false);
  }, [isMediaReady, isPlayingLogo]);

  // Keep the active caption chip in view when the strip opens.
  useEffect(() => {
    if (!showCCMenu) return;
    const root = ccScrollRef.current;
    if (!root) return;
    const active = root.querySelector<HTMLElement>('[data-cc-active="true"]');
    active?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    const sync = () => updateCcScrollHints();
    sync();
    const t = window.setTimeout(sync, 320);
    root.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    return () => {
      window.clearTimeout(t);
      root.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
    };
  }, [showCCMenu, selectedLangCode, updateCcScrollHints]);

  useEffect(() => {
    if (!isPlayingLogo || !logoMediaEl) return;

    let cancelled = false;
    logoMediaEl
      .play()
      .then(() => {
        if (cancelled) return;
        setIsPlaying(true);
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        logoMediaEl.muted = true;
        setIsMuted(true);
        logoMediaEl
          .play()
          .then(() => {
            if (cancelled) return;
            setIsPlaying(true);
            setIsLoading(false);
          })
          .catch(() => {
            // Bumper blocked or missing — go straight to the film.
            if (cancelled) return;
            setIsPlayingLogo(false);
            setIsLoading(true);
          });
      });

    return () => {
      cancelled = true;
    };
  }, [isPlayingLogo, logoMediaEl]);

  useEffect(() => {
    if (isPlayingLogo || didApplyStartAtRef.current) return;
    if (typeof startAt !== 'number' || startAt <= 0) return;
    const player = filmMediaEl;
    if (!player) return;

    const apply = () => {
      if (didApplyStartAtRef.current || !filmPlayerRef.current) return;
      filmPlayerRef.current.currentTime = startAt;
      currentTimeRef.current = startAt;
      paintTimeUi();
      didApplyStartAtRef.current = true;
    };

    if (player.readyState >= 1) apply();
    else player.addEventListener('loadedmetadata', apply, { once: true });
    return () => player.removeEventListener('loadedmetadata', apply);
  }, [isPlayingLogo, startAt, film?.id, paintTimeUi, filmMediaEl]);

  useEffect(() => {
    if (seekTo == null || isPlayingLogo) return;
    const player = filmMediaEl;
    if (!player) return;
    player.currentTime = seekTo;
    currentTimeRef.current = seekTo;
    paintTimeUi();
    syncCueToTime();
    setIsEnded(false);
    player.play().catch(() => {});
    onSeekHandled?.();
  }, [seekTo, isPlayingLogo, onSeekHandled, paintTimeUi, syncCueToTime, filmMediaEl]);

  useEffect(() => {
    const player = filmMediaEl;
    if (!player) return;
    const disableNativeTracks = () => {
      if (player.textTracks) {
        for (let i = 0; i < player.textTracks.length; i++) player.textTracks[i].mode = 'disabled';
      }
    };
    disableNativeTracks();
    player.textTracks.addEventListener('addtrack', disableNativeTracks);
    return () => player.textTracks.removeEventListener('addtrack', disableNativeTracks);
  }, [film?.id, filmMediaEl]);

  const handleVideoEnded = () => {
    if (isPlayingLogo) {
      setIsPlayingLogo(false);
      currentTimeRef.current = 0;
      paintTimeUi();
      if (filmPlayerRef.current) filmPlayerRef.current.muted = isMuted;
    } else {
      setIsEnded(true);
      setIsPlaying(false);
      onEnded?.();
    }
  };

  const handleScrubStart = useCallback(() => {
    if (!isPlayingLogo) setIsScrubbing(true);
  }, [isPlayingLogo]);

  const handleScrubChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isPlayingLogo) return;
      const targetTime = parseFloat(e.target.value);
      currentTimeRef.current = targetTime;
      if (filmPlayerRef.current) filmPlayerRef.current.currentTime = targetTime;
      paintProgress(targetTime, durationRef.current);
      syncCueToTime();
    },
    [isPlayingLogo, paintProgress, syncCueToTime]
  );

  const handleScrubEnd = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      if (isPlayingLogo) return;
      setIsScrubbing(false);
      const player = filmPlayerRef.current;
      if (!player || !durationRef.current) return;
      player.currentTime = parseFloat(e.currentTarget.value);
      currentTimeRef.current = player.currentTime;
      paintTimeUi();
      const duration = durationRef.current;
      const ratio = duration > 0 ? Math.min(1, Math.max(0, player.currentTime / duration)) : 0;
      paintFilmStrip(stripRailRef.current, stripMetaRef.current, ratio);
      syncCueToTime();
      showUIControls();
    },
    [isPlayingLogo, paintTimeUi, syncCueToTime, showUIControls]
  );

  const handleCircleScrubTo = useCallback(
    (ratio: number) => {
      if (isPlayingLogo) return;
      const duration = durationRef.current;
      if (!duration) return;
      const targetTime = Math.min(duration, Math.max(0, ratio * duration));
      currentTimeRef.current = targetTime;
      if (filmPlayerRef.current) filmPlayerRef.current.currentTime = targetTime;
      paintProgress(targetTime, duration);
      syncCueToTime();
    },
    [isPlayingLogo, paintProgress, syncCueToTime]
  );

  const handleCircleScrubEnd = useCallback(() => {
    if (isPlayingLogo) return;
    setIsScrubbing(false);
    paintTimeUi();
    syncCueToTime();
    showUIControls();
  }, [isPlayingLogo, paintTimeUi, syncCueToTime, showUIControls]);

  const playIcon = isPlaying ? (
    <img
      src="/icons/pause.svg"
      className={`${isCircleChrome ? 'w-8 h-8 sm:w-9 sm:h-9' : 'w-8 h-8'} ${iconInvert}`}
      alt={t('pause')}
    />
  ) : (
    <img
      src="/icons/play.svg"
      className={`${isCircleChrome ? 'w-8 h-8 sm:w-9 sm:h-9 ml-0.5' : 'w-8 h-8 ml-0.5'} ${iconInvert}`}
      alt={t('play')}
    />
  );
  const fullscreenIcon = isFullscreen ? (
    <img src="/icons/compress.svg" className={`w-6 h-6 ${iconInvert}`} alt={t('exitFullscreen')} />
  ) : (
    <img src="/icons/expand.svg" className={`w-6 h-6 ${iconInvert}`} alt={t('enterFullscreen')} />
  );
  const volumeIcon = isMuted ? (
    <img src="/icons/mute.svg" className={`w-6 h-6 ${iconInvert}`} alt={t('unmute')} />
  ) : (
    <img src="/icons/volume.svg" className={`w-6 h-6 ${iconInvert}`} alt={t('mute')} />
  );
  const captionsIcon = (
    <svg viewBox="0 0 640 640" className="w-6 h-6" fill="currentColor" aria-hidden>
      <path d="M64 192C64 156.7 92.7 128 128 128L512 128C547.3 128 576 156.7 576 192L576 448C576 483.3 547.3 512 512 512L128 512C92.7 512 64 483.3 64 448L64 192zM216 272L248 272C252.4 272 256 275.6 256 280C256 293.3 266.7 304 280 304C293.3 304 304 293.3 304 280C304 249.1 278.9 224 248 224L216 224C185.1 224 160 249.1 160 280L160 360C160 390.9 185.1 416 216 416L248 416C278.9 416 304 390.9 304 360C304 346.7 293.3 336 280 336C266.7 336 256 346.7 256 360C256 364.4 252.4 368 248 368L216 368C211.6 368 208 364.4 208 360L208 280C208 275.6 211.6 272 216 272zM384 280C384 275.6 387.6 272 392 272L424 272C428.4 272 432 275.6 432 280C432 293.3 442.7 304 456 304C469.3 304 480 293.3 480 280C480 249.1 454.9 224 424 224L392 224C361.1 224 336 249.1 336 280L336 360C336 390.9 361.1 416 392 416L424 416C454.9 416 480 390.9 480 360C480 346.7 469.3 336 456 336C442.7 336 432 346.7 432 360C432 364.4 428.4 368 424 368L392 368C387.6 368 384 364.4 384 360L384 280z" />
    </svg>
  );
  const rewindIcon = (
    <img src="/icons/back10.svg" className={`w-7 h-7 ${iconInvert}`} alt={t('rewind')} />
  );
  const forwardIcon = (
    <img src="/icons/forward10.svg" className={`w-7 h-7 ${iconInvert}`} alt={t('fastForward')} />
  );

  const ramsToolsSlot = showCCMenu ? (
    <div className="min-w-0 max-w-[min(84vw,300px)] flex items-center h-[18px] font-mono text-[13px] font-medium leading-none">
      <style
        dangerouslySetInnerHTML={{
          __html: `.fjorr-cc-scroll::-webkit-scrollbar{display:none!important}`,
        }}
      />
      <button
        type="button"
        onClick={() => void selectLanguage('none')}
        className={`shrink-0 pr-2 tracking-[0.08em] uppercase bg-transparent border-0 outline-none cursor-pointer whitespace-nowrap leading-none transition-opacity hover:opacity-100 ${
          selectedLangCode === 'none' ? 'text-[#ffd446] opacity-100' : 'opacity-90'
        }`}
      >
        {t('ccOff')}
      </button>
      <button
        type="button"
        aria-label="Scroll languages left"
        disabled={!ccCanScrollLeft}
        onClick={() => scrollCcStrip(-1)}
        className={`shrink-0 w-4 h-[18px] flex items-center justify-center border-0 outline-none leading-none transition-opacity ${
          ccCanScrollLeft
            ? 'cursor-pointer opacity-90 hover:opacity-100'
            : 'opacity-30 cursor-default'
        }`}
      >
        <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" fill="none" aria-hidden>
          <path
            d="M7.5 2.5L4 6l3.5 3.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div
        ref={ccScrollRef}
        className="fjorr-cc-scroll min-w-0 flex-1 flex items-center gap-2.5 h-[18px] overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {captionMenuItems(tracks).map((item) => {
          const active =
            selectedLangCode?.toLowerCase().trim() === item.code.toLowerCase();
          return (
            <button
              key={item.code}
              type="button"
              disabled={!item.available}
              data-cc-active={active ? 'true' : undefined}
              onClick={() => {
                if (!item.available) return;
                void selectLanguage(item.code);
              }}
              className={`snap-start shrink-0 bg-transparent border-0 outline-none leading-none whitespace-nowrap tracking-normal transition-opacity ${
                active
                  ? 'text-[#ffd446] opacity-100'
                  : item.available
                    ? 'opacity-90 hover:opacity-100'
                    : 'opacity-30 cursor-default'
              }`}
            >
              {item.name}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        aria-label="Scroll languages right"
        disabled={!ccCanScrollRight}
        onClick={() => scrollCcStrip(1)}
        className={`shrink-0 w-4 h-[18px] flex items-center justify-center border-0 outline-none leading-none transition-opacity ${
          ccCanScrollRight
            ? 'cursor-pointer opacity-90 hover:opacity-100'
            : 'opacity-30 cursor-default'
        }`}
      >
        <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" fill="none" aria-hidden>
          <path
            d="M4.5 2.5L8 6l-3.5 3.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  ) : (
    <>
      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? t('pause') : t('play')}
        className="font-mono text-[13px] font-medium tracking-[0.08em] uppercase bg-transparent border-0 outline-none cursor-pointer p-0 leading-none whitespace-nowrap opacity-90 hover:opacity-100 transition-opacity"
      >
        {isPlaying ? t('pause') : t('play')}
      </button>
      <button
        type="button"
        onClick={() => setShowCCMenu(true)}
        aria-label={t('captions')}
        className={`font-mono text-[13px] font-medium tracking-[0.08em] uppercase bg-transparent border-0 outline-none cursor-pointer p-0 leading-none whitespace-nowrap transition-opacity hover:opacity-100 ${
          selectedLangCode !== 'none' ? 'text-[#ffd446] opacity-100' : 'opacity-90'
        }`}
      >
        {t('subs')}
      </button>
      <button
        type="button"
        onClick={toggleMute}
        aria-label={isMuted ? t('unmute') : t('mute')}
        className={`font-mono text-[13px] font-medium tracking-[0.08em] uppercase bg-transparent border-0 outline-none cursor-pointer p-0 leading-none whitespace-nowrap transition-opacity hover:opacity-100 ${
          isMuted ? 'text-[#d90429] opacity-100' : 'opacity-90'
        }`}
      >
        {isMuted ? t('unmute') : t('mute')}
      </button>
      <button
        type="button"
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? t('exitFullscreen') : t('fullscreen')}
        className="font-mono text-[13px] font-medium tracking-[0.08em] uppercase bg-transparent border-0 outline-none cursor-pointer p-0 leading-none whitespace-nowrap opacity-90 hover:opacity-100"
      >
        {isFullscreen ? t('exit') : t('full')}
      </button>
    </>
  );

  const ramsFilmMeta = (() => {
    const dateVal = film?.story_date || '';
    const locationVal = film?.location || '';
    if (dateVal && locationVal) return `${dateVal} · ${locationVal}`;
    return dateVal || locationVal || undefined;
  })();

  const ramsIdentity =
    !isPlayingLogo && ramsUsesCompact ? (
      <TheaterRamsIdentity
        isLight={isFullscreen ? false : isLight}
        logoLabel={isEmbed ? t('watchOnFjorr') : t('closeTheater')}
        onLogoClick={handleCloseNavigation}
        filmTitle={film?.name || undefined}
        filmMeta={ramsFilmMeta}
      />
    ) : null;

  const ramsChrome = !isPlayingLogo ? (
    <TheaterRamsChrome
      scrubberRef={scrubberRef}
      playheadRef={playheadRef}
      elapsedRef={elapsedTimeRef}
      durationRef={durationTimeRef}
      isScrubbing={isScrubbing}
      isLight={isFullscreen ? false : isLight}
      logoLabel={isEmbed ? t('watchOnFjorr') : t('closeTheater')}
      onLogoClick={handleCloseNavigation}
      filmTitle={film?.name || undefined}
      filmMeta={ramsFilmMeta}
      toolsSlot={ramsToolsSlot}
      hideScrubber={ramsLayout === 'strip'}
      hideHeader={ramsUsesCompact}
      onScrubStart={handleScrubStart}
      onScrubChange={handleScrubChange}
      onScrubEnd={handleScrubEnd}
    />
  ) : null;

  const showRamsCaptionsOnVideo =
    selectedLangCode !== 'none' &&
    Boolean(currentSubtitleText) &&
    (ramsUsesCompact ? !ramsPlaqueMode : !ramsChromeUp);

  const ramsVideoStack = (
    <>
      {isPlayingLogo && (
        <video
          ref={bindLogoPlayer}
          src={LOGO_SOURCE}
          preload="metadata"
          playsInline
          onCanPlay={(e) => {
            e.currentTarget.muted = isMuted;
          }}
          onVolumeChange={(e) => setIsMuted(e.currentTarget.muted)}
          className="w-full h-full object-contain absolute inset-0 z-20 bg-black"
          onEnded={handleVideoEnded}
        />
      )}
      <video
        ref={bindFilmPlayer}
        id="fjorr-engine"
        preload="auto"
        playsInline
        crossOrigin="anonymous"
        onCanPlay={(e) => {
          e.currentTarget.muted = isMuted;
        }}
        onVolumeChange={(e) => setIsMuted(e.currentTarget.muted)}
        className="w-full h-full object-contain absolute inset-0 z-0 bg-black"
        onTimeUpdate={(e) => {
          if (isScrubbingRef.current) return;
          const time = e.currentTarget.currentTime;
          currentTimeRef.current = time;
          const now = performance.now();
          if (onTimeUpdate && now - lastParentTimePushRef.current > 250) {
            lastParentTimePushRef.current = now;
            onTimeUpdate(time);
          }
        }}
        onDurationChange={(e) => {
          durationRef.current = e.currentTarget.duration || 0;
          if (scrubberRef.current) {
            scrubberRef.current.max = String(durationRef.current || 100);
          }
          paintTimeUi();
        }}
        onPlaying={() => {
          setIsPlaying(true);
          setIsEnded(false);
          setIsLoading(false);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={handleVideoEnded}
      />
      {showRamsCaptionsOnVideo && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[8%] max-w-[min(92%,36rem)] px-3 py-1.5 rounded-[6px] bg-zinc-950/75 backdrop-blur-md border border-white/10 text-center text-[#F5F5F7] font-medium text-[13px] sm:text-[15px] tracking-tight leading-[1.35] z-25 pointer-events-none select-none font-sans whitespace-pre-line shadow-2xl">
          {currentSubtitleText}
        </div>
      )}
      {isLoading && (
        <div className="absolute inset-0 bg-black flex items-center justify-center text-sm font-sans font-bold tracking-normal text-white/0 z-30">
          {t('rolling')}
        </div>
      )}
    </>
  );

  const theater = (
    <div
      ref={bindContainer}
      id="fjorr-theater-root"
      tabIndex={-1}
      style={{ backgroundColor: shellBg, color: chromeFg }}
      className={
        isEmbed
          ? 'absolute inset-0 w-full h-full select-none overflow-hidden touch-none flex flex-col font-sans z-10 outline-none'
          : 'fixed inset-0 w-full h-[100dvh] select-none overflow-hidden touch-none flex flex-col font-sans z-[99999] outline-none'
      }
    >
      {isRamsChrome ? null : isCircleChrome ? (
        <button
          type="button"
          data-ui-control="true"
          onClick={handleCloseNavigation}
          className={`absolute top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] z-50 w-10 h-10 flex items-center justify-center cursor-pointer ${chromeInk} bg-transparent border-0 p-0 outline-none transition-all duration-500 ease-out hover:opacity-70 ${
            controlsVisible
              ? 'translate-y-0 opacity-100'
              : '-translate-y-2 opacity-0 pointer-events-none'
          }`}
          title={isEmbed ? t('watchOnFjorr') : t('closeTheater')}
        >
          {isEmbed ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
        </button>
      ) : (
      <header
        data-ui-control="true"
        className={`absolute top-0 inset-x-0 w-full h-[56px] pt-[12px] px-4 flex justify-center pointer-events-none z-50 transition-all duration-500 ease-out ${
          controlsVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <div className="inline-flex h-[44px] px-[30px] items-center gap-[20px] pointer-events-auto bg-transparent">
          <div className={`w-[50px] flex items-center ${chromeInk} shrink-0 translate-y-[2px]`}>
            <svg viewBox="0 0 143 81" className="w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M71.3559 13.2942C60.8993 13.2942 52.4273 21.7814 52.4273 32.2448C52.4273 42.7082 60.9046 51.1953 71.3559 51.1953C81.8073 51.1953 90.2846 42.7082 90.2846 32.2448C90.2846 21.7814 81.8073 13.2942 71.3559 13.2942ZM71.3559 39.7278C67.232 39.7278 63.8869 36.3789 63.8869 32.2501C63.8869 28.1214 67.232 24.7725 71.3559 24.7725C75.4799 24.7725 78.825 28.1214 78.825 32.2501C78.825 36.3789 75.4799 39.7278 71.3559 39.7278Z" fill="currentColor" />
              <path d="M35.9047 15.0355C35.4032 15.0355 34.9978 15.4414 34.9978 15.9435V60.9377C34.9978 65.4136 31.5887 69.0883 27.23 69.505C26.7605 69.5477 26.403 69.9322 26.403 70.4023V80.0912C26.403 80.6146 26.8405 81.0206 27.3633 80.9992C37.996 80.4971 46.4627 71.7109 46.4627 60.9377V15.9435C46.4627 15.4414 46.0573 15.0355 45.5558 15.0355H35.9047Z" fill="currentColor" />
              <path d="M0 0.908003V48.498C0 49.0001 0.405462 49.406 0.906954 49.406H11.9931C12.4946 49.406 12.9001 49.0001 12.9001 48.498V35.1397C12.9001 34.6376 13.3055 34.2317 13.807 34.2317H26.0616C26.5631 34.2317 26.9685 33.8258 26.9685 33.3237V23.6615C26.9685 23.1594 26.5631 22.7535 26.0616 22.7535H13.807C13.3055 22.7535 12.9001 22.3476 12.9001 21.8455V12.3755C12.9001 11.8735 13.3055 11.4675 13.807 11.4675H27.4967C27.9982 11.4675 28.4037 11.0616 28.4037 10.5595V0.908003C28.4037 0.405931 27.9982 0 27.4967 0H0.906954C0.405462 0 0 0.405931 0 0.908003Z" fill="currentColor" />
              <path d="M116.309 15.9435V22.7375C116.309 23.2395 115.402 23.6455 115.402 23.6455H108.509C108.066 23.6455 107.709 24.0033 107.709 24.4466V48.5568C107.709 49.0589 107.303 49.4648 106.802 49.4648H97.1508C96.6493 49.4648 96.2438 49.0589 96.2438 48.5568V15.9435C96.2438 15.4414 96.6493 15.0355 97.1508 15.0355H115.402C115.903 15.0355 116.309 15.4414 116.309 15.9435Z" fill="currentColor" />
              <path d="M143 15.9435V22.7375C143 23.2395 142.595 23.6455 142.093 23.6455H135.2C134.757 23.6455 134.4 24.0033 134.4 24.4466V48.5568C134.4 49.0589 133.994 49.4648 133.493 49.4648H123.842C123.34 49.4648 122.935 49.0589 122.935 48.5568V15.9435C122.935 15.4414 123.34 15.0355 123.842 15.0355H142.093C142.595 15.0355 143 15.4414 143 15.9435Z" fill="currentColor" />
            </svg>
          </div>
          <div className="flex items-center shrink-0">
            <span className={`font-sans text-xs font-medium tracking-normal select-none whitespace-nowrap ${chromeMuted}`}>
              {isEmbed ? t('watchOnFjorr') : tNav('tagline')}
            </span>
          </div>
          <button
            onClick={handleCloseNavigation}
            className={`w-[18px] h-[18px] flex items-center justify-center cursor-pointer shrink-0 ${chromeInk} bg-transparent border-0 p-0 outline-none transition-opacity hover:opacity-70`}
            title={isEmbed ? t('watchOnFjorr') : t('closeTheater')}
          >
            {isEmbed ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </header>
      )}

      {isRamsChrome ? (
        ramsLayout === 'strip' ? (
          <div
            data-rams-layout="strip"
            className={`absolute inset-0 z-10 flex items-center justify-center px-4 pointer-events-none transition-opacity duration-[280ms] ease-out ${
              ramsStageHidden ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <div
              className={`flex flex-col items-center pointer-events-auto ${
                ramsPlaqueMode ? 'gap-8 w-full' : 'gap-0 w-full max-w-[1200px]'
              }`}
            >
              {ramsPlaqueMode ? ramsIdentity : null}
              <div
                className={`relative overflow-hidden bg-black shrink-0 ${
                  ramsPlaqueMode && storyboard
                    ? 'sr-only'
                    : ramsPlaqueMode
                      ? 'w-[min(72vw,300px)] aspect-video rounded-[10px] shadow-[0_24px_80px_rgba(0,0,0,0.55)]'
                      : isFullscreen
                        ? 'w-full h-[100dvh] max-w-none rounded-none'
                        : 'w-full aspect-video max-h-[calc(100dvh-3rem)] rounded-none min-[1201px]:rounded-[12px]'
                }`}
              >
                {ramsVideoStack}
              </div>
              {ramsPlaqueMode ? (
                <>
                  {storyboard ? (
                    <TheaterFilmStrip
                      storyboard={storyboard}
                      railRef={stripRailRef}
                      metaRef={stripMetaRef}
                      scrubberRef={scrubberRef}
                      elapsedRef={elapsedTimeRef}
                      isScrubbing={isScrubbing}
                      isLight={isFullscreen ? false : isLight}
                      onScrubStart={handleScrubStart}
                      onScrubChange={handleScrubChange}
                      onScrubEnd={handleScrubEnd}
                    />
                  ) : null}
                  {ramsChrome}
                </>
              ) : null}
            </div>
          </div>
        ) : ramsLayout === 'plaque' ? (
          <div
            data-rams-layout="plaque"
            className={`absolute inset-0 z-10 flex items-center justify-center px-4 pointer-events-none transition-opacity duration-[280ms] ease-out ${
              ramsStageHidden ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <div
              className={`flex flex-col items-center pointer-events-auto ${
                ramsPlaqueMode ? 'gap-8' : 'gap-0 w-full max-w-[1200px]'
              }`}
            >
              {ramsPlaqueMode ? ramsIdentity : null}
              <div
                className={`relative overflow-hidden bg-black shrink-0 ${
                  isFullscreen && !ramsPlaqueMode
                    ? 'w-full h-[100dvh] max-w-none rounded-none'
                    : ramsPlaqueMode
                      ? 'w-[min(72vw,300px)] aspect-video rounded-[10px] shadow-[0_24px_80px_rgba(0,0,0,0.55)]'
                      : 'w-full aspect-video max-h-[calc(100dvh-3rem)] rounded-none min-[1201px]:rounded-[12px]'
                }`}
              >
                {ramsVideoStack}
              </div>
              {ramsPlaqueMode ? ramsChrome : null}
            </div>
          </div>
        ) : (
          <div
            data-rams-layout="overlay"
            className="absolute inset-0 z-10 flex items-center justify-center px-4 pointer-events-none"
          >
            <div
              className={`relative overflow-hidden bg-black pointer-events-auto w-full transition-opacity duration-500 ease-out ${
                ramsChromeUp ? 'opacity-10' : 'opacity-100'
              } ${
                isFullscreen
                  ? 'h-full max-w-none rounded-none'
                  : 'max-w-[1200px] aspect-video max-h-[calc(100dvh-3rem)] rounded-none min-[1201px]:rounded-[12px]'
              }`}
            >
              {ramsVideoStack}
            </div>

            <div
              className={`absolute inset-0 z-40 flex items-center justify-center px-4 pointer-events-none transition-opacity duration-500 ease-out ${
                ramsChromeUp ? 'opacity-100' : 'opacity-0'
              }`}
              aria-hidden={!ramsChromeUp}
            >
              <div className={ramsChromeUp ? 'pointer-events-auto' : 'pointer-events-none'}>
                {ramsChrome}
              </div>
            </div>
          </div>
        )
      ) : (
      <div className="flex-1 min-h-0 w-full flex items-center justify-center relative z-10">
        <div
          className={`relative overflow-hidden bg-black z-10 flex flex-col justify-end ${
            isFullscreen
              ? 'w-full h-full max-w-none rounded-none border-0'
              : isEmbed
                ? 'w-full h-full max-w-none rounded-none border-0 aspect-auto'
                : 'w-full max-w-[1200px] aspect-video xl:rounded-[12px]'
          }`}
        >
          {isPlayingLogo && (
            <video
              ref={bindLogoPlayer}
              src={LOGO_SOURCE}
              preload="metadata"
              playsInline
              onCanPlay={(e) => {
                e.currentTarget.muted = isMuted;
              }}
              onVolumeChange={(e) => setIsMuted(e.currentTarget.muted)}
              className="w-full h-full object-contain absolute inset-0 z-20 bg-black"
              onEnded={handleVideoEnded}
            />
          )}

          <video
            ref={bindFilmPlayer}
            id="fjorr-engine"
            preload="auto"
            playsInline
            crossOrigin="anonymous"
            onCanPlay={(e) => {
              e.currentTarget.muted = isMuted;
            }}
            onVolumeChange={(e) => setIsMuted(e.currentTarget.muted)}
            className="w-full h-full object-contain absolute inset-0 z-0 bg-black"
            onTimeUpdate={(e) => {
              if (isScrubbingRef.current) return;
              const time = e.currentTarget.currentTime;
              currentTimeRef.current = time;
              const now = performance.now();
              if (onTimeUpdate && now - lastParentTimePushRef.current > 250) {
                lastParentTimePushRef.current = now;
                onTimeUpdate(time);
              }
            }}
            onDurationChange={(e) => {
              durationRef.current = e.currentTarget.duration || 0;
              if (scrubberRef.current) {
                scrubberRef.current.max = String(durationRef.current || 100);
              }
              paintTimeUi();
            }}
            onPlaying={() => {
              setIsPlaying(true);
              setIsEnded(false);
              setIsLoading(false);
            }}
            onPause={() => setIsPlaying(false)}
            onEnded={handleVideoEnded}
          />

          <div
            className={`absolute inset-0 transition-opacity duration-500 pointer-events-none z-10 ${
              isLight ? 'bg-white/40' : 'bg-black/40'
            }`}
            style={{ opacity: controlsVisible ? 1 : 0 }}
          />

          {selectedLangCode !== 'none' && currentSubtitleText && (
            <div
              className={`absolute left-1/2 -translate-x-1/2 max-w-[min(92%,42rem)] px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-[6px] bg-zinc-950/75 backdrop-blur-md border border-white/10 text-center text-[#F5F5F7] font-medium text-[13px] sm:text-[15px] md:text-[16px] tracking-tight leading-[1.35] z-25 pointer-events-none select-none font-sans whitespace-pre-line shadow-2xl transition-[bottom] duration-300 ${
                isCircleChrome
                  ? 'bottom-[8%]'
                  : controlsVisible && !isPlayingLogo
                    ? 'bottom-[20%]'
                    : 'bottom-[6%]'
              }`}
            >
              {currentSubtitleText}
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-0 bg-black flex items-center justify-center text-sm font-sans font-bold tracking-normal text-white/0 z-30">
              {t('rolling')}
            </div>
          )}
        </div>
      </div>
      )}

      {isCircleChrome && (
        <div
          className={`absolute inset-0 z-30 flex items-center justify-center pointer-events-none transition-opacity duration-500 ease-out ${
            controlsVisible && !isPlayingLogo
              ? 'opacity-100'
              : 'opacity-0'
          }`}
        >
          <div
            className={`pointer-events-auto flex flex-col items-center gap-4 transition-transform duration-500 ease-out ${
              controlsVisible && !isPlayingLogo
                ? 'translate-y-0 scale-100'
                : 'translate-y-2 scale-95 pointer-events-none'
            }`}
          >
            <TheaterCircleControl
              progressRef={circleProgressRef}
              timeRef={elapsedTimeRef}
              isPlaying={isPlaying}
              isScrubbing={isScrubbing}
              isLight={isLight}
              captionsActive={selectedLangCode !== 'none'}
              showCCMenu={showCCMenu}
              playIcon={playIcon}
              rewindIcon={rewindIcon}
              forwardIcon={forwardIcon}
              captionsIcon={captionsIcon}
              fullscreenIcon={fullscreenIcon}
              volumeIcon={volumeIcon}
              playLabel={t('play')}
              pauseLabel={t('pause')}
              rewindLabel={t('rewind')}
              forwardLabel={t('fastForward')}
              captionsLabel={t('captions')}
              fullscreenLabel={t('fullscreen')}
              muteLabel={t('mute')}
              unmuteLabel={t('unmute')}
              isMuted={isMuted}
              onTogglePlay={togglePlay}
              onSeekBack={() => seekBy(-10)}
              onSeekForward={() => seekBy(10)}
              onToggleCaptions={() => setShowCCMenu(!showCCMenu)}
              onToggleFullscreen={toggleFullscreen}
              onToggleMute={toggleMute}
              onScrubStart={handleScrubStart}
              onScrubTo={handleCircleScrubTo}
              onScrubEnd={handleCircleScrubEnd}
            />
            {showCCMenu && (
              <div className="relative w-[min(92vw,28rem)] animate-in fade-in duration-200">
                <style
                  dangerouslySetInnerHTML={{
                    __html: `.fjorr-cc-scroll::-webkit-scrollbar{display:none!important}`,
                  }}
                />
                <div className="flex items-stretch rounded-[6px] bg-zinc-900/90 backdrop-blur-md border border-white/5 shadow-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => void selectLanguage('none')}
                    className={`shrink-0 px-3 py-2 text-[12px] font-semibold tracking-wide transition-colors bg-transparent border-0 border-r border-white/10 outline-none cursor-pointer ${
                      selectedLangCode === 'none'
                        ? 'text-[#ffd446]'
                        : 'text-white/45 hover:text-white/85'
                    }`}
                  >
                    {t('ccOff')}
                  </button>
                  <button
                    type="button"
                    aria-label="Scroll languages left"
                    disabled={!ccCanScrollLeft}
                    onClick={() => scrollCcStrip(-1)}
                    className={`shrink-0 w-7 flex items-center justify-center border-0 border-r border-white/10 outline-none transition-colors ${
                      ccCanScrollLeft
                        ? 'cursor-pointer text-white/50 hover:text-white'
                        : 'text-white/15 cursor-default'
                    }`}
                  >
                    <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" aria-hidden>
                      <path
                        d="M7.5 2.5L4 6l3.5 3.5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <div
                    ref={ccScrollRef}
                    className="fjorr-cc-scroll min-w-0 flex-1 flex items-center gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain px-2 py-1.5 scroll-smooth snap-x snap-mandatory"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {captionMenuItems(tracks).map((item) => {
                      const active =
                        selectedLangCode?.toLowerCase().trim() === item.code.toLowerCase();
                      return (
                        <button
                          key={item.code}
                          type="button"
                          title={
                            item.available
                              ? item.name
                              : `${item.name} (no captions yet)`
                          }
                          data-cc-active={active ? 'true' : undefined}
                          onClick={() => void selectLanguage(item.code)}
                          className={`snap-start shrink-0 px-2.5 py-1 rounded-[4px] text-[12px] font-semibold tracking-tight whitespace-nowrap transition-colors bg-transparent border-0 outline-none cursor-pointer ${
                            active
                              ? 'text-[#ffd446] bg-white/10'
                              : item.available
                                ? 'text-white/45 hover:text-white/85'
                                : 'text-white/25 hover:text-white/55'
                          }`}
                        >
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    aria-label="Scroll languages right"
                    disabled={!ccCanScrollRight}
                    onClick={() => scrollCcStrip(1)}
                    className={`shrink-0 w-7 flex items-center justify-center border-0 border-l border-white/10 outline-none transition-colors ${
                      ccCanScrollRight
                        ? 'cursor-pointer text-white/50 hover:text-white'
                        : 'text-white/15 cursor-default'
                    }`}
                  >
                    <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" aria-hidden>
                      <path
                        d="M4.5 2.5L8 6l-3.5 3.5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!isRamsChrome && (
      <div
        data-ui-control="true"
        className={`absolute bottom-0 inset-x-0 w-full flex flex-col justify-end items-center text-center z-30 transition-all duration-500 ease-out select-none px-8 pb-[calc(env(safe-area-inset-bottom)_+_2rem)] gap-3 ${
          controlsVisible && !isPlayingLogo
            ? 'translate-y-0 opacity-100'
            : 'translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <div className={`flex flex-col items-center pl-1 ${isLight ? 'text-[#0B0B0C]' : 'text-[#F5F5F7]'}`}>
          <h2 className="text-[20px] md:text-2xl font-bold tracking-tight leading-none">{film?.name}</h2>
          <p className="text-xs md:text-sm font-medium opacity-60 mt-2 tracking-normal">
            {(() => {
              const dateVal = film?.story_date || '';
              const locationVal = film?.location || '';
              if (dateVal && locationVal) return `${dateVal} · ${locationVal}`;
              return dateVal || locationVal || t('fallbackMeta');
            })()}
          </p>
        </div>

        {!isCircleChrome && !isRamsChrome && showCCMenu && (
          <div className="relative w-[min(92vw,36rem)] animate-in fade-in duration-200">
            <style
              dangerouslySetInnerHTML={{
                __html: `.fjorr-cc-scroll::-webkit-scrollbar{display:none!important}`,
              }}
            />
            <div className="flex items-stretch rounded-[6px] bg-zinc-900/90 backdrop-blur-md border border-white/5 shadow-xl overflow-hidden">
              <button
                type="button"
                onClick={() => void selectLanguage('none')}
                className={`shrink-0 px-3 py-2 text-[12px] font-semibold tracking-wide transition-colors bg-transparent border-0 border-r border-white/10 outline-none cursor-pointer ${
                  selectedLangCode === 'none'
                    ? 'text-[#ffd446]'
                    : 'text-white/45 hover:text-white/85'
                }`}
              >
                {t('ccOff')}
              </button>
              <button
                type="button"
                aria-label="Scroll languages left"
                disabled={!ccCanScrollLeft}
                onClick={() => scrollCcStrip(-1)}
                className={`shrink-0 w-7 flex items-center justify-center border-0 border-r border-white/10 outline-none transition-colors ${
                  ccCanScrollLeft
                    ? 'cursor-pointer text-white/50 hover:text-white'
                    : 'text-white/15 cursor-default'
                }`}
              >
                <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" aria-hidden>
                  <path
                    d="M7.5 2.5L4 6l3.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <div
                ref={ccScrollRef}
                className="fjorr-cc-scroll min-w-0 flex-1 flex items-center gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain px-2 py-1.5 scroll-smooth snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {captionMenuItems(tracks).map((item) => {
                  const active =
                    selectedLangCode?.toLowerCase().trim() === item.code.toLowerCase();
                  return (
                    <button
                      key={item.code}
                      type="button"
                      title={
                        item.available
                          ? item.name
                          : `${item.name} (no captions yet)`
                      }
                      data-cc-active={active ? 'true' : undefined}
                      onClick={() => void selectLanguage(item.code)}
                      className={`snap-start shrink-0 px-2.5 py-1 rounded-[4px] text-[12px] font-semibold tracking-tight whitespace-nowrap transition-colors bg-transparent border-0 outline-none cursor-pointer ${
                        active
                          ? 'text-[#ffd446] bg-white/10'
                          : item.available
                            ? 'text-white/45 hover:text-white/85'
                            : 'text-white/25 hover:text-white/55'
                      }`}
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                aria-label="Scroll languages right"
                disabled={!ccCanScrollRight}
                onClick={() => scrollCcStrip(1)}
                className={`shrink-0 w-7 flex items-center justify-center border-0 border-l border-white/10 outline-none transition-colors ${
                  ccCanScrollRight
                    ? 'cursor-pointer text-white/50 hover:text-white'
                    : 'text-white/15 cursor-default'
                }`}
              >
                <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" aria-hidden>
                  <path
                    d="M4.5 2.5L8 6l-3.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {!isCircleChrome && (
          <div className="flex items-center gap-2 h-10 relative justify-center">
            <button
              onClick={togglePlay}
              className="w-12 h-12 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity bg-transparent border-0 outline-none cursor-pointer"
              title={isPlaying ? t('pause') : t('play')}
            >
              {playIcon}
            </button>
            <button
              onClick={() => seekBy(-10)}
              className="w-10 h-10 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity bg-transparent border-0 outline-none cursor-pointer"
              title={t('rewind')}
            >
              <img src="/icons/back10.svg" className={`w-6 h-6 ${iconInvert}`} alt={t('rewind')} />
            </button>
            <button
              onClick={() => seekBy(10)}
              className="w-10 h-10 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity bg-transparent border-0 outline-none cursor-pointer"
              title={t('fastForward')}
            >
              <img src="/icons/forward10.svg" className={`w-6 h-6 ${iconInvert}`} alt={t('fastForward')} />
            </button>
            <button
              onClick={() => setShowCCMenu(!showCCMenu)}
              aria-pressed={selectedLangCode !== 'none'}
              className={`relative w-10 h-10 flex items-center justify-center transition-opacity bg-transparent border-0 outline-none cursor-pointer ${
                selectedLangCode !== 'none' || showCCMenu
                  ? 'opacity-100'
                  : 'opacity-70 hover:opacity-100'
              } ${selectedLangCode !== 'none' ? 'text-[#ffd446]' : chromeInk}`}
              title={t('captions')}
            >
              {captionsIcon}
            </button>
            <button
              onClick={toggleFullscreen}
              className="w-10 h-10 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity bg-transparent border-0 outline-none cursor-pointer"
              title={t('fullscreen')}
            >
              {fullscreenIcon}
            </button>
            <button
              onClick={toggleMute}
              className="w-10 h-10 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity bg-transparent border-0 outline-none cursor-pointer"
              title={isMuted ? t('unmute') : t('mute')}
            >
              {volumeIcon}
            </button>
          </div>
        )}

        {!isCircleChrome && (
          <TheaterScrubber
            scrubberRef={scrubberRef}
            playheadRef={playheadRef}
            scrubTimeRef={scrubTimeRef}
            isScrubbing={isScrubbing}
            isLight={isLight}
            onScrubStart={handleScrubStart}
            onScrubChange={handleScrubChange}
            onScrubEnd={handleScrubEnd}
          />
        )}
      </div>
      )}

      {/* End screen — opaque overlay (no live video blur) */}
      <div
        id="end-screen"
        data-ui-control="true"
        className="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-500 ease-in-out z-40"
        style={{
          backgroundColor: shellBg,
          opacity: isEnded ? 1 : 0,
          pointerEvents: isEnded ? 'auto' : 'none',
        }}
      >
        {/* Fjorr logo — top-left exit */}
        <button
          type="button"
          onClick={handleCloseNavigation}
          className={`absolute top-[max(1rem,env(safe-area-inset-top))] left-[max(1rem,env(safe-area-inset-left))] bg-transparent border-0 p-0 outline-none cursor-pointer transition-opacity opacity-60 hover:opacity-100`}
          aria-label={isEmbed ? t('watchOnFjorr') : t('closeTheater')}
        >
          <svg
            viewBox="0 0 143 81"
            className={`w-[36px] h-auto ${isLight ? 'text-[#0B0B0C]' : 'text-[#F5F5F7]'}`}
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <path d="M71.3559 13.2942C60.8993 13.2942 52.4273 21.7814 52.4273 32.2448C52.4273 42.7082 60.9046 51.1953 71.3559 51.1953C81.8073 51.1953 90.2846 42.7082 90.2846 32.2448C90.2846 21.7814 81.8073 13.2942 71.3559 13.2942ZM71.3559 39.7278C67.232 39.7278 63.8869 36.3789 63.8869 32.2501C63.8869 28.1214 67.232 24.7725 71.3559 24.7725C75.4799 24.7725 78.825 28.1214 78.825 32.2501C78.825 36.3789 75.4799 39.7278 71.3559 39.7278Z" />
            <path d="M35.9047 15.0355C35.4032 15.0355 34.9978 15.4414 34.9978 15.9435V60.9377C34.9978 65.4136 31.5887 69.0883 27.23 69.505C26.7605 69.5477 26.403 69.9322 26.403 70.4023V80.0912C26.403 80.6146 26.8405 81.0206 27.3633 80.9992C37.996 80.4971 46.4627 71.7109 46.4627 60.9377V15.9435C46.4627 15.4414 46.0573 15.0355 45.5558 15.0355H35.9047Z" />
            <path d="M0 0.908003V48.498C0 49.0001 0.405462 49.406 0.906954 49.406H11.9931C12.4946 49.406 12.9001 49.0001 12.9001 48.498V35.1397C12.9001 34.6376 13.3055 34.2317 13.807 34.2317H26.0616C26.5631 34.2317 26.9685 33.8258 26.9685 33.3237V23.6615C26.9685 23.1594 26.5631 22.7535 26.0616 22.7535H13.807C13.3055 22.7535 12.9001 22.3476 12.9001 21.8455V12.3755C12.9001 11.8735 13.3055 11.4675 13.807 11.4675H27.4967C27.9982 11.4675 28.4037 11.0616 28.4037 10.5595V0.908003C28.4037 0.405931 27.9982 0 27.4967 0H0.906954C0.405462 0 0 0.405931 0 0.908003Z" />
            <path d="M116.309 15.9435V22.7375C116.309 23.2395 115.402 23.6455 115.402 23.6455H108.509C108.066 23.6455 107.709 24.0033 107.709 24.4466V48.5568C107.709 49.0589 107.303 49.4648 106.802 49.4648H97.1508C96.6493 49.4648 96.2438 49.0589 96.2438 48.5568V15.9435C96.2438 15.4414 96.6493 15.0355 97.1508 15.0355H115.402C115.903 15.0355 116.309 15.4414 116.309 15.9435Z" />
            <path d="M143 15.9435V22.7375C143 23.2395 142.595 23.6455 142.093 23.6455H135.2C134.757 23.6455 134.4 24.0033 134.4 24.4466V48.5568C134.4 49.0589 133.994 49.4648 133.493 49.4648H123.842C123.34 49.4648 122.935 49.0589 122.935 48.5568V15.9435C122.935 15.4414 123.34 15.0355 123.842 15.0355H142.093C142.595 15.0355 143 15.4414 143 15.9435Z" />
          </svg>
        </button>

        <div className="max-w-2xl text-center flex flex-col items-center gap-8 px-6 relative">
          <p
            className={`font-sans text-lg font-semibold leading-relaxed max-w-lg ${
              isLight ? 'text-[#0B0B0C]/90' : 'text-[#F5F5F7]/90'
            }`}
          >
            {film?.last_line || t('fin')}
          </p>

          <button
            onClick={() => setSendOpen(true)}
            className={`font-sans font-semibold text-sm transition-colors bg-transparent border-0 outline-none cursor-pointer normal-case ${
              isLight ? 'text-[#0B0B0C]/50 hover:text-[#0B0B0C]' : 'text-white/50 hover:text-[#f5f5f7]'
            }`}
          >
            {t('share')}
          </button>

          <div
            className={`font-tradeGothic tracking-tight uppercase text-base ${
              isLight ? 'text-[#0B0B0C]/40' : 'text-[#F5F5F7]/40'
            }`}
          >
            <span>{film?.name}</span> &nbsp;<span>{film?.story_date}</span> &nbsp;
            <span>{film?.location}</span>
          </div>
        </div>
      </div>

      {sendOpen && (
        <FilmSendSheet
          open={sendOpen}
          onClose={() => setSendOpen(false)}
          film={{
            name: film?.name,
            slug: film?.slug,
            teaser: film?.teaser,
            runtime: film?.runtime,
            blok_tall: film?.blok_tall,
            hero_tall: film?.hero_tall,
          }}
          shareSeconds={currentTimeRef.current > 0 ? currentTimeRef.current : durationRef.current || null}
        />
      )}
    </div>
  );

  if (isEmbed) return theater;
  // Always portal out of home browse trees (visibility / stacking contexts).
  if (typeof document === 'undefined') return null;
  return createPortal(theater, document.body);
}
