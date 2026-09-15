'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { useRouter } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { parseLocale, localeLabels, locales, type AppLocale } from '@/i18n/config';
import { absoluteUrl } from '@/lib/site';
import { useTheaterHls } from '@/lib/theater/use-theater-hls';
import { useTheaterCaptions } from '@/lib/theater/use-theater-captions';
import { useTheaterChrome } from '@/lib/theater/use-theater-chrome';
import {
  TheaterCaptionsIcon,
  TheaterEnterFullscreenIcon,
  TheaterExitFullscreenIcon,
  TheaterPauseIcon,
  TheaterPlayIcon,
  TheaterPlusIcon,
  TheaterSeekBackIcon,
  TheaterSeekForwardIcon,
  TheaterSpeakerIcon,
  TheaterSpeakerMuteIcon,
} from '@/components/icons/TheaterControlIcons';
import { TheaterControlChip, TheaterRamsIdentity, TheaterRamsScrubber } from '@/components/TheaterRamsChrome';
import { FILM_RECORDED_EVENT, maybeRecordFilmView } from '@/lib/record-view';
import { fetchOwnBureauxActive } from '@/lib/bureaux-client';
import { storySettingDisplay } from '@/lib/story-year';

/** Throttle scrub-driven seeks to ~12.5Hz — UI paints immediately, video seeks lag slightly. */
const SCRUB_SEEK_INTERVAL_MS = 80;

const TheaterPlusPanel = dynamic(() => import('@/components/TheaterPlusPanel'), { ssr: false });
const TheaterPlusInfo = dynamic(() => import('@/components/TheaterPlusInfo'), { ssr: false });
const ViewerStampShare = dynamic(() => import('@/components/ViewerStampShare'), { ssr: false });

interface CinemaTheaterProps {
  film: {
    id: any;
    name: any;
    slug: any;
    mux_playback_id: any;
    last_line: any;
    last_line_attribution?: string | null;
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
  /** Open already in Plus (plaque craft desk). */
  initialTheaterMode?: 'watch' | 'plus';
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

function CinemaTheater({
  film,
  onClose,
  backUrl,
  startAt,
  seekTo = null,
  onSeekHandled,
  onTimeUpdate,
  onEnded,
  mode = 'theater',
  initialTheaterMode = 'watch',
}: CinemaTheaterProps) {
  const router = useRouter();
  const locale = parseLocale(useLocale());
  const t = useTranslations('Theater');
  const tPlus = useTranslations('Plus');
  /** Theater is always a black room — house keeps paper outside. */
  const isLight = false;
  const isEmbed = mode === 'embed';
  const chromeFg = '#F5F5F7';
  const shellBg = '#000000';

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isScrubbing, setIsScrubbing] = useState(false);
  /** Watch = immersive cinema. Plus = plaque craft desk (members only). */
  const [theaterMode, setTheaterMode] = useState<'watch' | 'plus'>('watch');
  /** Plus Machine — Bureaux members only. */
  const [plusMember, setPlusMember] = useState<boolean | null>(null);
  const [plusInfoOpen, setPlusInfoOpen] = useState(false);
  const [plusStamp, setPlusStamp] = useState(0);
  const [stampShare, setStampShare] = useState<{
    viewerNumber: number;
    filmVersion: number;
    memberNumber: number | null;
    recordedAt: string | null;
  } | null>(null);
  const plusMode = !isEmbed && theaterMode === 'plus';

  const skipBumper =
    isEmbed ||
    (typeof startAt === 'number' && startAt > 0) ||
    (typeof navigator !== 'undefined' &&
      (() => {
        const conn = (
          navigator as Navigator & {
            connection?: { saveData?: boolean; effectiveType?: string };
          }
        ).connection;
        if (!conn) return false;
        if (conn.saveData) return true;
        return (
          conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g'
        );
      })());
  const [isPlayingLogo, setIsPlayingLogo] = useState(!skipBumper);
  const LOGO_SOURCE =
    'https://media.fjorr.com/app-assets/studio-logo/fjorr-studio-logo-04.mp4';
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
  const playedFillRef = useRef<HTMLDivElement | null>(null);
  const scrubberRef = useRef<HTMLInputElement | null>(null);
  const elapsedTimeRef = useRef<HTMLSpanElement | null>(null);
  const durationTimeRef = useRef<HTMLSpanElement | null>(null);
  const pendingScrubSeekRef = useRef<number | null>(null);
  const scrubSeekTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrubSeekAtRef = useRef(0);

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
    const dur =
      duration > 0 && Number.isFinite(duration)
        ? duration
        : filmPlayerRef.current?.duration && Number.isFinite(filmPlayerRef.current.duration)
          ? filmPlayerRef.current.duration
          : 0;
    if (dur > 0) durationRef.current = dur;

    const ratio = dur > 0 ? Math.min(1, Math.max(0, time / dur)) : 0;
    const pct = ratio * 100;
    if (playheadRef.current) playheadRef.current.style.left = `${pct}%`;
    if (playedFillRef.current && playheadRef.current) {
      const lane = playheadRef.current.parentElement;
      const bar = playedFillRef.current.parentElement;
      if (lane && bar) {
        const barW = bar.clientWidth;
        const laneW = lane.clientWidth;
        const inset = Math.max(0, (barW - laneW) / 2);
        playedFillRef.current.style.width = `${inset + (pct / 100) * laneW}px`;
      } else {
        playedFillRef.current.style.width = `${pct}%`;
      }
    } else if (playedFillRef.current) {
      playedFillRef.current.style.width = `${pct}%`;
    }
    if (scrubberRef.current) {
      if (dur > 0) scrubberRef.current.max = String(dur);
      if (document.activeElement !== scrubberRef.current) {
        scrubberRef.current.value = String(time);
      }
    }
    const elapsedText = formatTimecode(time);
    const durationText = formatTimecode(dur || 0);
    if (elapsedTimeRef.current) elapsedTimeRef.current.textContent = elapsedText;
    if (durationTimeRef.current) durationTimeRef.current.textContent = durationText;
  }, []);

  const paintTimeUi = useCallback(() => {
    if (isScrubbingRef.current) return;
    paintProgress(currentTimeRef.current, durationRef.current);
  }, [paintProgress]);

  const handleCloseNavigation = useCallback(() => {
    if (isEmbed) {
      window.open(watchOnFjorrUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    // Flush Film Log / Viewer # on close — HLS often skips the ended event.
    if (film?.id) {
      maybeRecordFilmView(
        String(film.id),
        currentTimeRef.current,
        durationRef.current || film.runtime || null
      );
    }
    if (backUrl) router.push(backUrl);
    else onClose();
  }, [isEmbed, watchOnFjorrUrl, backUrl, router, onClose, film?.id, film?.runtime]);

  /** End screen → film info / artifacts sheet. */
  const handleArtifacts = useCallback(() => {
    const slug = film?.slug ? String(film.slug) : '';
    if (isEmbed) {
      window.open(
        slug ? absoluteUrl(`/film/${slug}#info`) : watchOnFjorrUrl,
        '_blank',
        'noopener,noreferrer'
      );
      return;
    }
    if (film?.id) {
      maybeRecordFilmView(
        String(film.id),
        currentTimeRef.current,
        durationRef.current || film.runtime || null
      );
    }
    onClose();
    if (slug) router.push(`/film/${slug}#info`);
  }, [
    isEmbed,
    watchOnFjorrUrl,
    film?.id,
    film?.slug,
    film?.runtime,
    onClose,
    router,
  ]);

  /** Escape: dismiss info → leave Plus → close theater. */
  const handleTheaterEscape = useCallback(() => {
    if (plusInfoOpen) {
      setPlusInfoOpen(false);
      return;
    }
    if (theaterMode === 'plus') {
      setTheaterMode('watch');
      return;
    }
    handleCloseNavigation();
  }, [plusInfoOpen, theaterMode, handleCloseNavigation]);

  const exitFullscreenIfNeeded = useCallback(() => {
    const container = containerRef.current;
    const activeVideo = isPlayingLogo ? logoPlayerRef.current : filmPlayerRef.current;
    const doc = document as Document & {
      webkitFullscreenElement?: Element;
      webkitExitFullscreen?: () => void;
    };
    const isMobileSafari =
      /iPhone|iPod/.test(navigator.userAgent) && !(document as any).requestFullscreen;
    const inFs =
      !!document.fullscreenElement ||
      !!doc.webkitFullscreenElement ||
      !!(activeVideo as any)?.webkitDisplayingFullscreen;
    if (!inFs) return;
    if (isMobileSafari && (activeVideo as any)?.webkitExitFullscreen) {
      (activeVideo as any).webkitExitFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if (doc.webkitExitFullscreen) {
      doc.webkitExitFullscreen();
    }
    void container;
  }, [isPlayingLogo]);

  useEffect(() => {
    if (isEmbed) {
      setPlusMember(false);
      return;
    }
    let mounted = true;
    const refresh = () => {
      fetchOwnBureauxActive().then((active) => {
        if (!mounted) return;
        setPlusMember(active);
        if (!active) {
          setTheaterMode('watch');
          setPlusInfoOpen(false);
        }
      });
    };
    refresh();
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      mounted = false;
      window.removeEventListener('focus', onFocus);
    };
  }, [isEmbed]);

  const enterPlus = useCallback(() => {
    if (isEmbed || isPlayingLogo || !plusMember) return;
    exitFullscreenIfNeeded();
    const player = filmPlayerRef.current;
    if (player && !player.paused) player.pause();
    setPlusStamp(Math.floor(currentTimeRef.current || 0));
    setPlusInfoOpen(false);
    setTheaterMode('plus');
  }, [isEmbed, isPlayingLogo, plusMember, exitFullscreenIfNeeded]);

  const exitPlus = useCallback(() => {
    setTheaterMode('watch');
    setPlusInfoOpen(false);
  }, []);

  // Film-page “Open Plus” — Bureaux members only.
  useEffect(() => {
    if (isEmbed || initialTheaterMode !== 'plus' || plusMember === null) return;
    if (!plusMember) {
      router.push('/bureaux');
      return;
    }
    setTheaterMode('plus');
  }, [isEmbed, initialTheaterMode, plusMember, router]);

  // Soft-pause once Plus is up.
  useEffect(() => {
    if (isEmbed || isPlayingLogo || theaterMode !== 'plus') return;
    const player = filmPlayerRef.current;
    if (player && !player.paused) player.pause();
    setPlusStamp(Math.floor(currentTimeRef.current || 0));
  }, [isEmbed, isPlayingLogo, theaterMode]);

  useEffect(() => {
    if (!isEnded) return;
    setTheaterMode('watch');
    setPlusInfoOpen(false);
  }, [isEnded]);

  // First Voyageur # → member stamp ceremony.
  useEffect(() => {
    if (isEmbed || !film?.id) return;
    const filmId = String(film.id);
    const onRecorded = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        filmId?: string;
        viewerNumber?: number;
        filmVersion?: number;
        firstStamp?: boolean;
        recorded?: boolean;
        memberNumber?: number | null;
        recordedAt?: string | null;
      };
      if (String(detail?.filmId || '') !== filmId) return;
      const n = Number(detail?.viewerNumber);
      const v = Number(detail?.filmVersion);
      const m = Number(detail?.memberNumber);
      if (!detail?.firstStamp || !Number.isFinite(n) || n < 1) return;
      if (!detail.recorded) return;
      setStampShare({
        viewerNumber: n,
        filmVersion: Number.isFinite(v) && v >= 1 ? v : 1,
        memberNumber: Number.isFinite(m) && m >= 1 ? m : null,
        recordedAt: detail.recordedAt || new Date().toISOString(),
      });
    };
    window.addEventListener(FILM_RECORDED_EVENT, onRecorded);
    return () => window.removeEventListener(FILM_RECORDED_EVENT, onRecorded);
  }, [isEmbed, film?.id]);

  const togglePlay = useCallback(() => {
    const player = isPlayingLogo ? logoPlayerRef.current : filmPlayerRef.current;
    if (!player) return;
    if (isPlaying) player.pause();
    else void player.play().catch(() => {});
  }, [isPlaying, isPlayingLogo]);

  const toggleMute = useCallback(() => {
    const next = !isMuted;
    if (logoPlayerRef.current) logoPlayerRef.current.muted = next;
    if (filmPlayerRef.current) filmPlayerRef.current.muted = next;
    setIsMuted(next);
  }, [isMuted]);

  const prepareFullscreenEnterRef = useRef<() => void>(() => {});

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

    const entering =
      !document.fullscreenElement &&
      !doc.webkitFullscreenElement &&
      !(activeVideo as any).webkitDisplayingFullscreen;

    if (entering) {
      prepareFullscreenEnterRef.current();
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

  const { controlsVisible, isFullscreen, showUIControls, prepareFullscreenEnter } = useTheaterChrome({
    containerEl,
    filmPlayerRef,
    logoPlayerRef,
    isPlayingLogo,
    isPlaying,
    isEmbed,
    showCCMenu,
    isScrubbing,
    chassisMode: true,
    pinControls: plusMode,
    onTogglePlay: togglePlay,
    onToggleMute: toggleMute,
    onToggleFullscreen: toggleFullscreen,
    onToggleCaptionsMenu: () => {
      if (tracks.length === 0) return;
      setShowCCMenu((v) => !v);
    },
    onSeekBy: seekBy,
    onClose: handleTheaterEscape,
  });
  prepareFullscreenEnterRef.current = prepareFullscreenEnter;

  const onFrameClick = useCallback(
    (event: React.MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-ui-control="true"]')) return;
      if (isEnded) return;
      if (showCCMenu) {
        setShowCCMenu(false);
        return;
      }
      togglePlay();
      showUIControls();
    },
    [isEnded, showCCMenu, showUIControls, togglePlay]
  );

  /** Rams chrome visible — identity above + tools below; frame size stays put. */
  const ramsChromeUp = (controlsVisible || plusMode) && !isPlayingLogo && !isEmbed;
  const captionsOn = selectedLangCode !== 'none';

  // Plaque chrome stays mounted — repaint playhead when it becomes visible.
  useLayoutEffect(() => {
    if (isPlayingLogo) return;
    paintProgress(currentTimeRef.current, durationRef.current);
  }, [isPlayingLogo, ramsChromeUp, paintProgress]);

  // rAF clock while playing — skipped entirely when chrome is down and captions are off,
  // since there's nothing on screen to paint.
  useEffect(() => {
    if (!isPlaying || isPlayingLogo) return;
    if (!ramsChromeUp && !captionsOn) return;
    let raf = 0;
    const loop = () => {
      if (ramsChromeUp) paintTimeUi();
      if (captionsOn) syncCueToTime();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, isPlayingLogo, ramsChromeUp, captionsOn, paintTimeUi, syncCueToTime]);

  // Film Log / Viewer # — native listeners + interval (don't rely on React onTimeUpdate alone).
  useEffect(() => {
    if (isEmbed || isPlayingLogo || !filmMediaEl || !film?.id) return;
    const filmId = String(film.id);
    const runtime = film.runtime ?? null;

    const tick = (force = false) => {
      const seconds = filmMediaEl.currentTime || 0;
      const duration =
        filmMediaEl.duration && Number.isFinite(filmMediaEl.duration)
          ? filmMediaEl.duration
          : runtime;
      maybeRecordFilmView(filmId, seconds, duration, force);
    };

    const onTime = () => tick(false);
    const onEndedNative = () => tick(true);

    filmMediaEl.addEventListener('timeupdate', onTime);
    filmMediaEl.addEventListener('ended', onEndedNative);
    const interval = window.setInterval(() => {
      if (!filmMediaEl.paused && !filmMediaEl.ended) tick(false);
    }, 3000);

    tick(false);

    return () => {
      filmMediaEl.removeEventListener('timeupdate', onTime);
      filmMediaEl.removeEventListener('ended', onEndedNative);
      window.clearInterval(interval);
    };
  }, [isEmbed, isPlayingLogo, filmMediaEl, film?.id, film?.runtime]);

  useEffect(() => {
    didApplyStartAtRef.current = false;
    if (elapsedTimeRef.current) elapsedTimeRef.current.textContent = '00:00';
    if (durationTimeRef.current) durationTimeRef.current.textContent = '00:00';
  }, [film?.id]);

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

  // Language board lives on the frame — dismiss it if chrome idle-hides.
  useEffect(() => {
    if (!controlsVisible) setShowCCMenu(false);
  }, [controlsVisible]);

  useEffect(() => {
    if (!showCCMenu) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-cc-menu-root="true"]')) return;
      setShowCCMenu(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [showCCMenu]);

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
    if (!player || !isMediaReady) return;

    const syncFromPlayer = () => {
      const duration = player.duration;
      if (Number.isFinite(duration) && duration > 0) {
        durationRef.current = duration;
        if (scrubberRef.current) scrubberRef.current.max = String(duration);
      }
      currentTimeRef.current = player.currentTime;
      paintProgress(player.currentTime, durationRef.current);
    };

    const apply = () => {
      if (didApplyStartAtRef.current || !filmPlayerRef.current) return;
      const duration = player.duration;
      const maxT =
        Number.isFinite(duration) && duration > 0 ? Math.max(0, duration - 0.35) : startAt;
      const target = Math.min(startAt, maxT);
      player.currentTime = target;
      currentTimeRef.current = target;
      if (Number.isFinite(duration) && duration > 0) {
        durationRef.current = duration;
        if (scrubberRef.current) scrubberRef.current.max = String(duration);
      }
      paintProgress(target, durationRef.current);
    };

    apply();

    const onSeeked = () => {
      didApplyStartAtRef.current = true;
      syncFromPlayer();
    };
    const onDuration = () => {
      syncFromPlayer();
      // HLS often ignores the first seek until duration is known — retry once.
      if (!didApplyStartAtRef.current && Math.abs(player.currentTime - startAt) > 1.25) {
        apply();
      }
    };

    player.addEventListener('seeked', onSeeked);
    player.addEventListener('durationchange', onDuration);
    return () => {
      player.removeEventListener('seeked', onSeeked);
      player.removeEventListener('durationchange', onDuration);
    };
  }, [isPlayingLogo, startAt, film?.id, paintProgress, filmMediaEl, isMediaReady]);

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
      if (film?.id) {
        maybeRecordFilmView(
          String(film.id),
          Number.POSITIVE_INFINITY,
          durationRef.current || film.runtime || 1,
          true
        );
      }
      setIsEnded(true);
      setIsPlaying(false);
      onEnded?.();
    }
  };

  const handleRewatch = useCallback(() => {
    setIsEnded(false);
    setShowCCMenu(false);
    const player = filmPlayerRef.current;
    if (!player) return;
    player.currentTime = 0;
    currentTimeRef.current = 0;
    paintTimeUi();
    syncCueToTime();
    void player.play().catch(() => {});
  }, [paintTimeUi, syncCueToTime]);

  const handleScrubStart = useCallback(() => {
    if (!isPlayingLogo) setIsScrubbing(true);
  }, [isPlayingLogo]);

  // Flushes the most recent scrub position onto the actual video element.
  const flushScrubSeek = useCallback(() => {
    if (scrubSeekTimerRef.current) {
      clearTimeout(scrubSeekTimerRef.current);
      scrubSeekTimerRef.current = null;
    }
    const pending = pendingScrubSeekRef.current;
    if (pending == null) return;
    pendingScrubSeekRef.current = null;
    lastScrubSeekAtRef.current = performance.now();
    if (filmPlayerRef.current) filmPlayerRef.current.currentTime = pending;
  }, []);

  // UI (playhead/clocks/captions) updates immediately; the real seek is capped
  // at ~12.5Hz so scrubbing doesn't hammer the video element while dragging.
  const scheduleScrubSeek = useCallback(
    (time: number) => {
      pendingScrubSeekRef.current = time;
      const elapsed = performance.now() - lastScrubSeekAtRef.current;
      if (elapsed >= SCRUB_SEEK_INTERVAL_MS) {
        flushScrubSeek();
        return;
      }
      if (!scrubSeekTimerRef.current) {
        scrubSeekTimerRef.current = setTimeout(flushScrubSeek, SCRUB_SEEK_INTERVAL_MS - elapsed);
      }
    },
    [flushScrubSeek]
  );

  useEffect(() => {
    return () => {
      if (scrubSeekTimerRef.current) clearTimeout(scrubSeekTimerRef.current);
    };
  }, []);

  const handleScrubChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isPlayingLogo) return;
      const targetTime = parseFloat(e.target.value);
      currentTimeRef.current = targetTime;
      paintProgress(targetTime, durationRef.current);
      syncCueToTime();
      scheduleScrubSeek(targetTime);
      if (theaterMode === 'plus') {
        setPlusStamp(Math.floor(targetTime));
      }
    },
    [isPlayingLogo, paintProgress, syncCueToTime, scheduleScrubSeek, theaterMode]
  );

  const handleScrubEnd = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      if (isPlayingLogo) return;
      setIsScrubbing(false);
      const player = filmPlayerRef.current;
      if (!player || !durationRef.current) return;
      pendingScrubSeekRef.current = parseFloat(e.currentTarget.value);
      flushScrubSeek();
      currentTimeRef.current = player.currentTime;
      paintTimeUi();
      syncCueToTime();
      showUIControls();
    },
    [isPlayingLogo, flushScrubSeek, paintTimeUi, syncCueToTime, showUIControls]
  );

  const pickCaptionLanguage = useCallback(
    (code: string) => {
      if (code !== 'none') {
        const item = captionMenuItems(tracks).find((row) => row.code === code);
        if (item && !item.available) return;
      }
      void selectLanguage(code);
      setShowCCMenu(false);
      showUIControls();
    },
    [tracks, selectLanguage, showUIControls]
  );

  const toolBtn =
    'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-0 bg-transparent p-0 text-[#F5F5F7] outline-none transition-opacity duration-200 hover:opacity-100 sm:h-9 sm:w-9';
  const iconSize = 18;

  const ramsToolsLeading = (
    <>
      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? t('pause') : t('play')}
        className={`${toolBtn} opacity-100`}
      >
        {isPlaying ? (
          <TheaterPauseIcon size={iconSize} />
        ) : (
          <TheaterPlayIcon size={iconSize} />
        )}
      </button>
      <button
        type="button"
        onClick={() => {
          seekBy(-10);
          showUIControls();
        }}
        aria-label={t('rewind')}
        className={`${toolBtn} opacity-90 hover:opacity-100`}
      >
        <TheaterSeekBackIcon size={iconSize} />
      </button>
      <button
        type="button"
        onClick={() => {
          seekBy(10);
          showUIControls();
        }}
        aria-label={t('fastForward')}
        className={`${toolBtn} opacity-90 hover:opacity-100`}
      >
        <TheaterSeekForwardIcon size={iconSize} />
      </button>
    </>
  );

  const ramsToolsTrailing = (
    <>
      {tracks.length > 0 ? (
        <div className="relative" data-cc-menu-root="true">
          <button
            type="button"
            onClick={() => {
              setShowCCMenu((v) => !v);
              showUIControls();
            }}
            aria-label={t('captions')}
            aria-expanded={showCCMenu}
            aria-haspopup="listbox"
            className={`${toolBtn} ${
              showCCMenu || selectedLangCode !== 'none'
                ? 'text-[#F5F5F7] opacity-100'
                : 'opacity-90'
            }`}
          >
            <TheaterCaptionsIcon size={iconSize} />
          </button>
          {showCCMenu && !isPlayingLogo ? (
            <div
              data-ui-control="true"
              data-cc-pop="true"
              role="listbox"
              aria-label={t('captions')}
              className="absolute bottom-full right-0 z-50 mb-2 max-h-[min(50dvh,18rem)] min-w-[10rem] overflow-y-auto overscroll-contain rounded-[10px] bg-[#1C1C1E] py-1.5 text-[#F5F5F7] shadow-[0_8px_28px_rgba(0,0,0,0.35)] ring-1 ring-white/10 sm:left-1/2 sm:right-auto sm:-translate-x-1/2"
            >
              <button
                type="button"
                role="option"
                aria-selected={selectedLangCode === 'none'}
                onClick={() => pickCaptionLanguage('none')}
                className={`flex w-full items-center px-3 py-1.5 text-left font-sans text-[13px] leading-none tracking-normal border-0 bg-transparent outline-none cursor-pointer ${
                  selectedLangCode === 'none'
                    ? 'font-semibold opacity-100'
                    : 'font-medium opacity-60 hover:opacity-100'
                }`}
              >
                {t('ccOff')}
              </button>
              {captionMenuItems(tracks).map((item) => {
                const active =
                  selectedLangCode?.toLowerCase().trim() ===
                  item.code.toLowerCase();
                return (
                  <button
                    key={item.code}
                    type="button"
                    role="option"
                    aria-selected={active}
                    disabled={!item.available}
                    onClick={() => pickCaptionLanguage(item.code)}
                    className={`flex w-full items-center px-3 py-1.5 text-left font-sans text-[13px] leading-none tracking-normal border-0 bg-transparent outline-none ${
                      !item.available
                        ? 'cursor-default opacity-25'
                        : active
                          ? 'cursor-pointer font-semibold opacity-100'
                          : 'cursor-pointer font-medium opacity-60 hover:opacity-100'
                    }`}
                  >
                    {item.name}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
      <button
        type="button"
        onClick={toggleMute}
        aria-label={isMuted ? t('unmute') : t('mute')}
        className={`${toolBtn} ${isMuted ? 'opacity-100' : 'opacity-90'}`}
      >
        {isMuted ? (
          <TheaterSpeakerMuteIcon size={iconSize} />
        ) : (
          <TheaterSpeakerIcon size={iconSize} />
        )}
      </button>
      {!plusMode ? (
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? t('exitFullscreen') : t('fullscreen')}
          className={`${toolBtn} opacity-90`}
        >
          {isFullscreen ? (
            <TheaterExitFullscreenIcon size={iconSize} />
          ) : (
            <TheaterEnterFullscreenIcon size={iconSize} />
          )}
        </button>
      ) : null}
    </>
  );

  const ramsFilmMeta = (() => {
    const setting = storySettingDisplay(film?.story_date);
    const rawLoc = film?.location;
    const place =
      typeof rawLoc === 'string'
        ? rawLoc.trim() || null
        : Array.isArray(rawLoc)
          ? rawLoc.map((v) => String(v).trim()).filter(Boolean).join(', ') || null
          : null;
    if (setting && place) return `${setting} · ${place}`;
    return setting || place || undefined;
  })();

  const ramsScrubber = !isPlayingLogo ? (
    <TheaterRamsScrubber
      scrubberRef={scrubberRef}
      playheadRef={playheadRef}
      playedFillRef={playedFillRef}
      elapsedRef={elapsedTimeRef}
      durationRef={durationTimeRef}
      isScrubbing={isScrubbing}
      plusMode={plusMode}
      compact
      onScrubStart={handleScrubStart}
      onScrubChange={handleScrubChange}
      onScrubEnd={handleScrubEnd}
    />
  ) : null;

  const ramsControlChip =
    !isPlayingLogo && ramsScrubber ? (
      <TheaterControlChip
        visible={ramsChromeUp}
        toolsLeading={ramsToolsLeading}
        toolsTrailing={ramsToolsTrailing}
        scrubber={ramsScrubber}
        isScrubbing={isScrubbing}
        plusMode={plusMode}
        onKeepAwake={() => {
          showUIControls();
          paintProgress(currentTimeRef.current, durationRef.current);
        }}
      />
    ) : null;

  const ramsIdentity = !isPlayingLogo ? (
    <div
      className={`absolute left-0 right-0 top-full z-20 mt-3 transition-opacity duration-300 ease-out ${
        ramsChromeUp ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden={!ramsChromeUp}
    >
      <TheaterRamsIdentity
        isLight={isLight}
        filmTitle={film?.name || undefined}
        filmMeta={ramsFilmMeta}
      />
      {plusMode && film?.id ? (
        <div className="mt-3 max-h-[36dvh] w-full max-w-lg overflow-y-auto">
          <TheaterPlusPanel
            filmId={String(film.id)}
            filmSlug={film.slug ? String(film.slug) : undefined}
            atSeconds={plusStamp}
            isLight={isLight}
            onExit={exitPlus}
          />
        </div>
      ) : null}
    </div>
  ) : null;

  const showRamsCaptionsOnVideo =
    selectedLangCode !== 'none' && Boolean(currentSubtitleText);

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
          className="w-full h-full object-contain absolute inset-0 z-20"
          onEnded={handleVideoEnded}
        />
      )}
      <video
        ref={bindFilmPlayer}
        id="fjorr-engine"
        preload="metadata"
        playsInline
        crossOrigin="anonymous"
        onCanPlay={(e) => {
          e.currentTarget.muted = isMuted;
        }}
        onVolumeChange={(e) => setIsMuted(e.currentTarget.muted)}
        className="w-full h-full object-contain absolute inset-0 z-0"
        onTimeUpdate={(e) => {
          if (isScrubbingRef.current) return;
          const time = e.currentTarget.currentTime;
          currentTimeRef.current = time;
          if (film?.id && !isPlayingLogo) {
            maybeRecordFilmView(
              String(film.id),
              time,
              durationRef.current || film.runtime || null
            );
          }
          const now = performance.now();
          if (onTimeUpdate && now - lastParentTimePushRef.current > 250) {
            lastParentTimePushRef.current = now;
            onTimeUpdate(time);
          }
          if (theaterMode === 'plus') {
            const floor = Math.floor(time);
            setPlusStamp((prev) => (prev === floor ? prev : floor));
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
        <div
          className="absolute bottom-[10%] left-1/2 z-25 max-w-[min(92%,36rem)] -translate-x-1/2 rounded-[6px] border border-white/10 bg-zinc-950/90 px-3 py-1.5 text-center font-sans text-[13px] font-medium leading-[1.35] tracking-tight text-[#F5F5F7] shadow-2xl pointer-events-none select-none whitespace-pre-line backdrop-blur-md sm:text-[15px]"
        >
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
      {!isEmbed ? (
        <button
          type="button"
          data-ui-control="true"
          onClick={handleCloseNavigation}
          aria-label={t('closeTheater')}
          title={t('close')}
          className={`pointer-events-auto absolute right-4 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-transparent transition-opacity hover:opacity-100 md:right-8 md:top-6 lg:right-10 lg:top-8 [@media(max-height:740px)]:right-3 [@media(max-height:740px)]:top-2 [@media(max-height:740px)]:h-8 [@media(max-height:740px)]:w-8 ${
            isLight ? 'text-[#0B0B0C]/55 hover:text-[#0B0B0C]' : 'text-[#F5F5F7]/55 hover:text-[#F5F5F7]'
          }`}
        >
          <span className="text-[28px] font-light leading-none [@media(max-height:740px)]:text-[22px]" aria-hidden>
            ×
          </span>
        </button>
      ) : null}

      <div
        data-rams-layout="plaque"
        className={`absolute inset-0 z-10 flex items-center justify-center pointer-events-none ${
          isFullscreen ? 'px-0' : 'px-4 pb-16 sm:pb-20'
        }`}
      >
        <div
          className={`relative w-full pointer-events-auto ${
            isFullscreen ? 'h-full max-w-none' : 'max-w-[1200px]'
          }`}
        >
          <div
            className={`relative isolate w-full transition-[border-radius,box-shadow] duration-500 ease-out transform-gpu ${
              isFullscreen
                ? 'h-full max-w-none rounded-none shadow-none'
                : plusMode
                  ? 'aspect-video max-h-[calc(100dvh-11rem)] rounded-none shadow-none min-[1201px]:rounded-[12px]'
                  : 'aspect-video max-h-[calc(100dvh-8rem)] rounded-none shadow-none min-[1201px]:rounded-[12px]'
            }`}
          >
            {/* Video stays clipped; chrome sits above so the CC menu can open upward. */}
            <div
              onClick={onFrameClick}
              className="absolute inset-0 cursor-pointer overflow-hidden bg-black"
            >
              {ramsVideoStack}
            </div>
            {ramsControlChip}
          </div>
          {!isFullscreen ? ramsIdentity : null}
        </div>
      </div>

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
        <div
          className={`max-w-2xl text-center flex flex-col items-center gap-8 px-6 relative ${
            isLight ? 'text-[#0B0B0C]' : 'text-[#F5F5F7]'
          }`}
        >
          {film?.last_line || film?.last_line_attribution ? (
            <div className="flex max-w-lg flex-col items-center gap-3">
              {film?.last_line ? (
                <p
                  className={`font-sans text-lg font-semibold leading-relaxed ${
                    isLight ? 'text-[#0B0B0C]/90' : 'text-[#F5F5F7]/90'
                  }`}
                >
                  {film.last_line}
                </p>
              ) : null}
              {film?.last_line_attribution ? (
                <p
                  className={`font-sans text-[12px] font-medium leading-snug tracking-normal ${
                    isLight ? 'text-[#0B0B0C]/40' : 'text-[#F5F5F7]/40'
                  }`}
                >
                  {film.last_line_attribution}
                </p>
              ) : null}
            </div>
          ) : null}

          {(film?.name || film?.story_date || film?.location) && (
            <div
              className={`font-sans text-[12px] font-normal tracking-normal leading-snug ${
                isLight ? 'text-[#0B0B0C]/40' : 'text-[#F5F5F7]/40'
              }`}
            >
              {[film?.name, film?.story_date, film?.location].filter(Boolean).join(' · ')}
            </div>
          )}

          <div
            className={`flex items-center justify-center gap-x-3.5 ${
              isLight ? 'text-[#0B0B0C]/55' : 'text-[#F5F5F7]/55'
            }`}
          >
            <button
              type="button"
              onClick={handleArtifacts}
              className="font-mono text-[13px] font-medium tracking-[0.05em] uppercase bg-transparent border-0 outline-none cursor-pointer p-0 leading-none whitespace-nowrap opacity-90 hover:opacity-100 transition-opacity"
            >
              {t('artifacts')}
            </button>
            <button
              type="button"
              onClick={handleRewatch}
              className="font-mono text-[13px] font-medium tracking-[0.05em] uppercase bg-transparent border-0 outline-none cursor-pointer p-0 leading-none whitespace-nowrap opacity-90 hover:opacity-100 transition-opacity"
            >
              {t('rewatch')}
            </button>
          </div>
        </div>
      </div>

      <TheaterPlusInfo
        open={plusInfoOpen}
        onClose={() => setPlusInfoOpen(false)}
        isLight={isLight}
      />

      {stampShare && film?.slug ? (
        <ViewerStampShare
          open
          onClose={() => setStampShare(null)}
          filmName={String(film.name || 'Fjorr')}
          filmSlug={String(film.slug)}
          filmPoster={(film.blok_tall || film.hero_tall || null) as string | null}
          viewerNumber={stampShare.viewerNumber}
          filmVersion={stampShare.filmVersion}
          memberNumber={stampShare.memberNumber}
          recordedAt={stampShare.recordedAt}
        />
      ) : null}
    </div>
  );

  if (isEmbed) return theater;
  // Always portal out of home browse trees (visibility / stacking contexts).
  if (typeof document === 'undefined') return null;
  return createPortal(theater, document.body);
}

// Parent (transcript dock) pushes playbackTime updates that shouldn't force
// this whole player to re-render — props are kept stable so memo actually skips.
export default React.memo(CinemaTheater);
