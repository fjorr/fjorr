'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

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
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMoveRef = useRef(0);

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
    if (isPlayingLogo) {
      setControlsVisible(false);
      return;
    }
    setControlsVisible(true);
    armIdleHide();
  }, [isPlayingLogo, armIdleHide]);

  // Idle hide whenever chrome is up — playing or paused (plaque grows back on mobile).
  useEffect(() => {
    if (!controlsVisible || isPlayingLogo || showCCMenu || isScrubbing) {
      if (hideTimeoutRef.current && (showCCMenu || isScrubbing)) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
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

    const onMove = () => {
      if (!armed) return;
      const now = performance.now();
      if (now - lastMoveRef.current < 80) return;
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
      setIsFullscreen(
        !!document.fullscreenElement ||
          !!(document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement ||
          !!(filmPlayerRef.current as HTMLVideoElement & { webkitDisplayingFullscreen?: boolean })
            ?.webkitDisplayingFullscreen ||
          !!(logoPlayerRef.current as HTMLVideoElement & { webkitDisplayingFullscreen?: boolean })
            ?.webkitDisplayingFullscreen
      );
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
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
  ]);

  return {
    controlsVisible,
    setControlsVisible,
    isFullscreen,
    showUIControls,
  };
}
