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
import TheaterRamsChrome, { TheaterRamsIdentity, PLAQUE_WIDTH } from '@/components/TheaterRamsChrome';
import { useColorScheme } from '@/components/ColorSchemeProvider';
import { LIGHT_PAGE_BG, LIGHT_PAGE_FG } from '@/lib/color-scheme';
import { FILM_RECORDED_EVENT, maybeRecordFilmView } from '@/lib/record-view';

/** Throttle scrub-driven seeks to ~12.5Hz — UI paints immediately, video seeks lag slightly. */
const SCRUB_SEEK_INTERVAL_MS = 80;

const FilmSendSheet = dynamic(() => import('@/components/FilmSendSheet'), { ssr: false });
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
  const { isLight } = useColorScheme();
  const isEmbed = mode === 'embed';
  const chromeFg = isLight ? LIGHT_PAGE_FG : '#F5F5F7';
  const shellBg = isLight ? LIGHT_PAGE_BG : '#000000';

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  /** Watch = immersive cinema. Plus = plaque craft desk. */
  const [theaterMode, setTheaterMode] = useState<'watch' | 'plus'>(
    !isEmbed && initialTheaterMode === 'plus' ? 'plus' : 'watch'
  );
  const [plusInfoOpen, setPlusInfoOpen] = useState(false);
  const [plusStamp, setPlusStamp] = useState(0);
  const [stampShare, setStampShare] = useState<{
    viewerNumber: number;
    filmVersion: number;
    memberNumber: number | null;
  } | null>(null);
  const plusMode = !isEmbed && theaterMode === 'plus';

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

  const enterPlus = useCallback(() => {
    if (isEmbed || isPlayingLogo) return;
    exitFullscreenIfNeeded();
    const player = filmPlayerRef.current;
    if (player && !player.paused) player.pause();
    setPlusStamp(Math.floor(currentTimeRef.current || 0));
    setPlusInfoOpen(false);
    setTheaterMode('plus');
  }, [isEmbed, isPlayingLogo, exitFullscreenIfNeeded]);

  const exitPlus = useCallback(() => {
    setTheaterMode('watch');
    setPlusInfoOpen(false);
  }, []);

  // Entered via film-page “Open Plus” — soft-pause once the film is up.
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

  // First Viewer # on this film → share ritual.
  useEffect(() => {
    if (isEmbed || !film?.id) return;
    const filmId = String(film.id);
    const onRecorded = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        filmId?: string;
        viewerNumber?: number;
        filmVersion?: number;
        firstStamp?: boolean;
        memberNumber?: number | null;
      };
      if (String(detail?.filmId || '') !== filmId) return;
      const n = Number(detail?.viewerNumber);
      const v = Number(detail?.filmVersion);
      const m = Number(detail?.memberNumber);
      if (!detail?.firstStamp || !Number.isFinite(n) || n < 1) return;
      setStampShare({
        viewerNumber: n,
        filmVersion: Number.isFinite(v) && v >= 1 ? v : 1,
        memberNumber: Number.isFinite(m) && m >= 1 ? m : null,
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

  /** Rams chrome visible — drives plaque shrink. Plus pins plaque. */
  const ramsChromeUp = (controlsVisible || plusMode) && !isPlayingLogo && !isEmbed;
  const plaqueCompact = ramsChromeUp;
  const captionsOn = selectedLangCode !== 'none';

  // Plaque chrome stays mounted — repaint playhead when it becomes visible.
  useLayoutEffect(() => {
    if (isPlayingLogo) return;
    paintProgress(currentTimeRef.current, durationRef.current);
  }, [isPlayingLogo, plaqueCompact, paintProgress]);

  // rAF clock while playing — skipped entirely when chrome is down and captions are off,
  // since there's nothing on screen to paint.
  useEffect(() => {
    if (!isPlaying || isPlayingLogo) return;
    if (!plaqueCompact && !captionsOn) return;
    let raf = 0;
    const loop = () => {
      if (plaqueCompact) paintTimeUi();
      if (captionsOn) syncCueToTime();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, isPlayingLogo, plaqueCompact, captionsOn, paintTimeUi, syncCueToTime]);

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
    'font-mono text-[13px] font-medium tracking-[0.05em] uppercase bg-transparent border-0 outline-none cursor-pointer p-0 leading-none whitespace-nowrap transition-opacity hover:opacity-100';

  const ramsToolsSlot = (
    <>
      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? t('pause') : t('play')}
        className={`${toolBtn} font-bold opacity-100`}
      >
        {isPlaying ? t('pause') : t('play')}
      </button>
      {tracks.length > 0 ? (
        <button
          type="button"
          onClick={() => setShowCCMenu((v) => !v)}
          aria-label={t('captions')}
          aria-expanded={showCCMenu}
          className={`${toolBtn} ${
            showCCMenu || selectedLangCode !== 'none'
              ? isLight
                ? 'text-[#C9A24B] opacity-100'
                : 'text-[#ffd446] opacity-100'
              : 'opacity-90'
          }`}
        >
          {selectedLangCode !== 'none'
            ? `${t('subs')} (${selectedLangCode.toUpperCase()})`
            : t('subs')}
        </button>
      ) : null}
      <button
        type="button"
        onClick={toggleMute}
        aria-label={isMuted ? t('unmute') : t('mute')}
        className={`${toolBtn} transition-[opacity,color,text-shadow] duration-200 ${
          isMuted
            ? isLight
              ? 'text-[#0B0B0C] opacity-100 [text-shadow:0_0_10px_rgba(11,11,12,0.35),0_0_22px_rgba(11,11,12,0.18)]'
              : 'text-[#F5F5F7] opacity-100 [text-shadow:0_0_10px_rgba(245,245,247,0.55),0_0_22px_rgba(245,245,247,0.28)]'
            : 'opacity-90'
        }`}
      >
        {isMuted ? t('unmute') : t('mute')}
      </button>
      {!plusMode ? (
        <button
          type="button"
          onClick={() => {
            showUIControls();
            setSendOpen(true);
          }}
          aria-label={t('share')}
          className={`${toolBtn} opacity-90`}
        >
          {t('share')}
        </button>
      ) : null}
      {!plusMode ? (
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? t('exitFullscreen') : t('fullscreen')}
          className={`${toolBtn} opacity-90`}
        >
          {isFullscreen ? t('exit') : t('full')}
        </button>
      ) : null}
      {!isEmbed && !plusMode ? (
        <button
          type="button"
          onClick={enterPlus}
          aria-label={tPlus('modePlus')}
          className={`${toolBtn} font-bold opacity-90 hover:opacity-100`}
        >
          {tPlus('modePlus')}
        </button>
      ) : null}
      {!isEmbed && plusMode ? (
        <>
          <button
            type="button"
            onClick={() => setPlusInfoOpen(true)}
            aria-label={tPlus('infoTitle')}
            title={tPlus('infoTitle')}
            className="inline-flex items-center justify-center bg-transparent border-0 outline-none cursor-pointer p-0 opacity-70 hover:opacity-100 transition-opacity"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <circle
                cx="8"
                cy="8"
                r="6.25"
                stroke="currentColor"
                strokeWidth="1.25"
              />
              <path
                d="M8 7.25V11"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
              />
              <circle cx="8" cy="5.15" r="0.85" fill="currentColor" />
            </svg>
          </button>
          <button
            type="button"
            onClick={exitPlus}
            aria-label={tPlus('modeExit')}
            className={`${toolBtn} font-bold opacity-90 hover:opacity-100`}
          >
            {tPlus('modeExit')}
          </button>
        </>
      ) : null}
      <button
        type="button"
        onClick={handleCloseNavigation}
        aria-label={t('closeTheater')}
        title={t('close')}
        className="font-mono text-[18px] font-medium leading-none bg-transparent border-0 outline-none cursor-pointer p-0 whitespace-nowrap opacity-90 hover:opacity-100"
      >
        ×
      </button>
    </>
  );

  const ramsFilmMeta = (() => {
    const dateVal = film?.story_date || '';
    const locationVal = film?.location || '';
    if (dateVal && locationVal) return `${dateVal} · ${locationVal}`;
    return dateVal || locationVal || undefined;
  })();

  const ramsIdentity = !isPlayingLogo ? (
      <TheaterRamsIdentity
        isLight={isLight}
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
      isLight={isLight}
      logoLabel={isEmbed ? t('watchOnFjorr') : t('closeTheater')}
      onLogoClick={handleCloseNavigation}
      filmTitle={film?.name || undefined}
      filmMeta={ramsFilmMeta}
      toolsSlot={ramsToolsSlot}
      belowToolsSlot={
        plusMode && film?.id ? (
          <TheaterPlusPanel
            filmId={String(film.id)}
            filmSlug={film.slug ? String(film.slug) : undefined}
            atSeconds={plusStamp}
            isLight={isLight}
          />
        ) : null
      }
      hideHeader
      onScrubStart={handleScrubStart}
      onScrubChange={handleScrubChange}
      onScrubEnd={handleScrubEnd}
    />
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
        preload="auto"
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
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[8%] max-w-[min(92%,36rem)] px-3 py-1.5 rounded-[6px] bg-zinc-950/90 backdrop-blur-md border border-white/10 text-center text-[#F5F5F7] font-medium text-[13px] sm:text-[15px] tracking-tight leading-[1.35] z-25 pointer-events-none select-none font-sans whitespace-pre-line shadow-2xl">
          {currentSubtitleText}
        </div>
      )}
      {showCCMenu && tracks.length > 0 && !isPlayingLogo ? (
        <div
          data-ui-control="true"
          role="dialog"
          aria-label={t('captions')}
          className="absolute inset-0 z-40 flex items-stretch justify-start bg-black/60 px-4 py-4 sm:px-6"
          onClick={() => setShowCCMenu(false)}
        >
          <div
            className="h-full w-full max-w-[min(100%,22rem)] overflow-hidden columns-2 gap-x-5 [column-fill:auto]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => pickCaptionLanguage('none')}
              className={`inline-block mb-1.5 p-[6px] rounded-[4px] font-mono text-[13px] font-medium tracking-[0.05em] uppercase leading-none border-0 outline-none cursor-pointer break-inside-avoid ${
                selectedLangCode === 'none'
                  ? 'bg-[#ffd446] text-[#0B0B0C]'
                  : 'bg-[#8A8A8E] text-[#F5F5F7] hover:bg-[#9A9A9E]'
              }`}
            >
              {t('ccOff')}
            </button>
            {captionMenuItems(tracks).map((item) => {
              const active =
                selectedLangCode?.toLowerCase().trim() === item.code.toLowerCase();
              return (
                <button
                  key={item.code}
                  type="button"
                  disabled={!item.available}
                  onClick={() => pickCaptionLanguage(item.code)}
                  className={`block w-full py-1 text-left font-mono text-[13px] font-medium tracking-[0.05em] uppercase leading-tight bg-transparent border-0 outline-none transition-opacity break-inside-avoid ${
                    active
                      ? 'text-[#ffd446] opacity-100 cursor-pointer'
                      : item.available
                        ? 'text-[#F5F5F7] opacity-80 hover:opacity-100 cursor-pointer'
                        : 'text-[#F5F5F7] opacity-25 cursor-default'
                  }`}
                >
                  {item.name}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
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
      <div
        data-rams-layout="plaque"
        className={`absolute inset-0 z-10 flex items-center justify-center pointer-events-none ${
          isFullscreen && !plaqueCompact ? 'px-0' : 'px-4'
        }`}
      >
        <div
          className={`flex flex-col items-center pointer-events-auto transition-[gap,max-width] duration-500 ease-out ${
            isFullscreen && !plaqueCompact
              ? 'w-full h-full max-w-none gap-0'
              : `w-full max-w-[1200px] ${plaqueCompact ? 'gap-6 sm:gap-8' : 'gap-0'}`
          }`}
        >
          <div
            className={`w-full flex justify-center overflow-hidden transition-all duration-500 ease-out ${
              plaqueCompact
                ? 'opacity-100 max-h-28 translate-y-0'
                : 'opacity-0 max-h-0 -translate-y-2 pointer-events-none'
            }`}
          >
            {ramsIdentity}
          </div>
          <div
            className={`relative isolate overflow-hidden bg-black shrink-0 transition-all duration-500 ease-out transform-gpu ${
              isFullscreen && !plaqueCompact
                ? 'w-full h-full max-w-none rounded-none shadow-none'
                : plaqueCompact
                  ? `${PLAQUE_WIDTH} aspect-video rounded-[10px] shadow-[0_24px_80px_rgba(0,0,0,0.55)]`
                  : 'w-full aspect-video max-h-[calc(100dvh-3rem)] rounded-none min-[1201px]:rounded-[12px] shadow-none'
            }`}
            style={
              isLight && !(isFullscreen && !plaqueCompact)
                ? {
                    // Cover subpixel black AA on rounded edges against the light page.
                    boxShadow: `0 0 0 1px ${LIGHT_PAGE_BG}`,
                    WebkitMaskImage: '-webkit-radial-gradient(white, black)',
                  }
                : undefined
            }
          >
            {ramsVideoStack}
          </div>
          <div
            className={`w-full flex justify-center overflow-hidden transition-all duration-500 ease-out ${
              plaqueCompact
                ? plusMode
                  ? 'opacity-100 max-h-[28rem] translate-y-0'
                  : 'opacity-100 max-h-48 translate-y-0'
                : 'opacity-0 max-h-0 translate-y-2 pointer-events-none'
            }`}
            aria-hidden={!plaqueCompact}
          >
            {ramsChrome}
          </div>
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
          <p
            className={`font-sans text-lg font-semibold leading-relaxed max-w-lg ${
              isLight ? 'text-[#0B0B0C]/90' : 'text-[#F5F5F7]/90'
            }`}
          >
            {film?.last_line || t('fin')}
          </p>

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
              onClick={handleCloseNavigation}
              className="font-mono text-[13px] font-medium tracking-[0.05em] uppercase bg-transparent border-0 outline-none cursor-pointer p-0 leading-none whitespace-nowrap opacity-90 hover:opacity-100 transition-opacity"
            >
              {t('close')}
            </button>
            <button
              type="button"
              onClick={() => setSendOpen(true)}
              className="font-mono text-[13px] font-medium tracking-[0.05em] uppercase bg-transparent border-0 outline-none cursor-pointer p-0 leading-none whitespace-nowrap opacity-90 hover:opacity-100 transition-opacity"
            >
              {t('share')}
            </button>
            <button
              type="button"
              onClick={handleRewatch}
              className="font-mono text-[13px] font-medium tracking-[0.05em] uppercase bg-transparent border-0 outline-none cursor-pointer p-0 leading-none whitespace-nowrap opacity-90 hover:opacity-100 transition-opacity"
            >
              {t('rewatch')}
            </button>
          </div>

          <svg
            viewBox="0 0 143 81"
            className={`w-[28px] h-auto opacity-80 ${isLight ? 'text-[#0B0B0C]' : 'text-[#F5F5F7]'}`}
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
          viewerNumber={stampShare.viewerNumber}
          filmVersion={stampShare.filmVersion}
          memberNumber={stampShare.memberNumber}
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
