'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const CHROME_SETTLE_MS = 2000;
const CHROME_SETTLE_MOVE_WINDOW_MS = 400;
/** Ignore trackpad/mouse jitter — must travel this far to reveal chrome. */
const SHOW_MOVE_THRESHOLD_PX = 12;

type Args = {
  containerEl: HTMLDivElement | null;
  filmPlayerRef: React.RefObject<HTMLVideoElement | null>;
  logoPlayerRef: React.RefObject<HTMLVideoElement | null>;
  isPlayingLogo: boolean;
  isPlaying: boolean;
  isEmbed: boolean;
  showCCMenu: boolean;
  isScrubbing: boolean;
  /** When true, video click shows/hides chrome only (no play toggle). */
  chassisMode?: boolean;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onToggleCaptionsMenu: () => void;
  onSeekBy: (delta: number) => void;
  onClose: () => void;
};

function readIsFullscreen(
  filmPlayerRef: React.RefObject<HTMLVideoElement | null>,
  logoPlayerRef: React.RefObject<HTMLVideoElement | null>
) {
  const doc = document as Document & { webkitFullscreenElement?: Element };
  return (
    !!document.fullscreenElement ||
    !!doc.webkitFullscreenElement ||
    !!(filmPlayerRef.current as HTMLVideoElement & { webkitDisplayingFullscreen?: boolean })
      ?.webkitDisplayingFullscreen ||
    !!(logoPlayerRef.current as HTMLVideoElement & { webkitDisplayingFullscreen?: boolean })
      ?.webkitDisplayingFullscreen
  );
}

export function useTheaterChrome({
  containerEl,
  filmPlayerRef,
  logoPlayerRef,
  isPlayingLogo,
  isPlaying: _isPlaying,
  isEmbed,
  showCCMenu,
  isScrubbing,
  chassisMode = false,
  onTogglePlay,
  onToggleMute,
  onToggleFullscreen,
  onToggleCaptionsMenu,
  onSeekBy,
  onClose,
}: Args) {
  const [controlsVisible, setControlsVisible] = useState(!chassisMode);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMoveRef = useRef(0);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const moveAccumRef = useRef(0);
  const settleUntilRef = useRef(0);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasPlayingLogoRef = useRef(isPlayingLogo);
  const isPlayingLogoRef = useRef(isPlayingLogo);
  isPlayingLogoRef.current = isPlayingLogo;

  const hideDelayMs = chassisMode ? 2200 : 2000;
  const showCCMenuRef = useRef(showCCMenu);
  const isScrubbingRef = useRef(isScrubbing);
  showCCMenuRef.current = showCCMenu;
  isScrubbingRef.current = isScrubbing;

  const armIdleHide = useCallback(() => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      if (showCCMenuRef.current || isScrubbingRef.current) return;
      setControlsVisible(false);
    }, hideDelayMs);
  }, [hideDelayMs]);

  const showUIControls = useCallback(() => {
    if (isPlayingLogoRef.current) {
      setControlsVisible(false);
      return;
    }
    // Settle window: stay full-frame until grace ends.
    if (performance.now() < settleUntilRef.current) return;
    setControlsVisible(true);
    armIdleHide();
  }, [armIdleHide]);

  /**
   * Hide chrome for 2s (full player). If the mouse is still moving when the
   * window ends, shrink to plaque / reveal controls; otherwise stay full.
   */
  const beginChromeSettle = useCallback(() => {
    setControlsVisible(false);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    lastMoveRef.current = 0;
    moveAccumRef.current = 0;
    lastPointerRef.current = null;
    settleUntilRef.current = performance.now() + CHROME_SETTLE_MS;
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    settleTimerRef.current = setTimeout(() => {
      settleUntilRef.current = 0;
      settleTimerRef.current = null;
      if (isPlayingLogoRef.current) return;
      const movedRecently =
        lastMoveRef.current > 0 &&
        performance.now() - lastMoveRef.current < CHROME_SETTLE_MOVE_WINDOW_MS;
      if (movedRecently) {
        setControlsVisible(true);
        armIdleHide();
      }
    }, CHROME_SETTLE_MS);
  }, [armIdleHide]);

  const prepareFullscreenEnter = beginChromeSettle;

  // Bumper → film: launch full size with no controls, then settle.
  useEffect(() => {
    const wasLogo = wasPlayingLogoRef.current;
    wasPlayingLogoRef.current = isPlayingLogo;
    if (isPlayingLogo) {
      setControlsVisible(false);
      return;
    }
    if (wasLogo && !isPlayingLogo && chassisMode && !isEmbed) {
      beginChromeSettle();
    }
  }, [isPlayingLogo, chassisMode, isEmbed, beginChromeSettle]);

  // Idle hide whenever chrome is up — playing or paused (plaque grows back on mobile).
  useEffect(() => {
    if (!controlsVisible || isPlayingLogo || showCCMenu || isScrubbing) {
      if (hideTimeoutRef.current && (showCCMenu || isScrubbing)) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      if (!controlsVisible) {
        moveAccumRef.current = 0;
        lastPointerRef.current = null;
      }
      return;
    }
    armIdleHide();
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [controlsVisible, isPlayingLogo, showCCMenu, isScrubbing, armIdleHide]);

  // Ignore the opening click/touch that mounted the theater.
  useEffect(() => {
    const root = containerEl;
    if (!root) return;

    let armed = false;
    const armTimer = window.setTimeout(() => {
      armed = true;
    }, 300);

    const onMove = (e: MouseEvent) => {
      if (!armed) return;
      const now = performance.now();
      const prev = lastPointerRef.current;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };

      // First sample only sets a baseline — don't reveal on a single jitter tick.
      if (!prev) return;

      const dist = Math.hypot(e.clientX - prev.x, e.clientY - prev.y);

      if (!controlsVisible) {
        moveAccumRef.current += dist;
        if (moveAccumRef.current < SHOW_MOVE_THRESHOLD_PX) return;
        moveAccumRef.current = 0;
      } else if (now - lastMoveRef.current < 80 && lastMoveRef.current > 0) {
        return;
      }

      lastMoveRef.current = now;
      showUIControls();
    };

    const onInteract = (e: Event) => {
      if (!armed) return;
      const target = e.target as HTMLElement;
      if (target.closest('[data-ui-control="true"]')) return;
      if (chassisMode) {
        // Rams plaque: tap only reveals / dismisses chrome — play is button-only.
        if (controlsVisible) {
          if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
          setControlsVisible(false);
        } else {
          showUIControls();
        }
        return;
      }
      if (controlsVisible) {
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        setControlsVisible(false);
      } else {
        showUIControls();
      }
    };

    root.addEventListener('mousemove', onMove, { passive: true });
    root.addEventListener('click', onInteract);
    root.addEventListener('touchend', onInteract);
    return () => {
      window.clearTimeout(armTimer);
      root.removeEventListener('mousemove', onMove);
      root.removeEventListener('click', onInteract);
      root.removeEventListener('touchend', onInteract);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [containerEl, controlsVisible, showUIControls, chassisMode, onTogglePlay]);

  useEffect(() => {
    const handleFsChange = () => {
      const next = readIsFullscreen(filmPlayerRef, logoPlayerRef);
      setIsFullscreen(next);
      if (!next) {
        settleUntilRef.current = 0;
        if (settleTimerRef.current) {
          clearTimeout(settleTimerRef.current);
          settleTimerRef.current = null;
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    };
  }, [filmPlayerRef, logoPlayerRef]);

  // Keyboard shortcuts when theater is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          onTogglePlay();
          showUIControls();
          break;
        case 'm':
          e.preventDefault();
          onToggleMute();
          showUIControls();
          break;
        case 'f':
          e.preventDefault();
          if (!readIsFullscreen(filmPlayerRef, logoPlayerRef)) {
            prepareFullscreenEnter();
          }
          onToggleFullscreen();
          break;
        case 'c':
          e.preventDefault();
          onToggleCaptionsMenu();
          showUIControls();
          break;
        case 'arrowleft':
        case 'j':
          e.preventDefault();
          onSeekBy(-10);
          showUIControls();
          break;
        case 'arrowright':
        case 'l':
          e.preventDefault();
          onSeekBy(10);
          showUIControls();
          break;
        case 'escape':
          if (!isEmbed) {
            e.preventDefault();
            onClose();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    isEmbed,
    onTogglePlay,
    onToggleMute,
    onToggleFullscreen,
    onToggleCaptionsMenu,
    onSeekBy,
    onClose,
    showUIControls,
    prepareFullscreenEnter,
    filmPlayerRef,
    logoPlayerRef,
  ]);

  return {
    controlsVisible,
    setControlsVisible,
    isFullscreen,
    showUIControls,
    prepareFullscreenEnter,
  };
}
