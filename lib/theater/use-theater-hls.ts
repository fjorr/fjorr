'use client';

import { useEffect, useRef, useState } from 'react';
import type Hls from 'hls.js';

type Args = {
  /** Live video node (from callback ref) — do not rely on ref.current alone in effects. */
  mediaElement: HTMLVideoElement | null;
  playbackId: string | null | undefined;
  /** When true, attach/preload but do not autoplay. */
  preloadOnly: boolean;
  isMuted: boolean;
  onFatalError?: (message: string) => void;
  filmTitle?: string | null;
};

/**
 * Attach Mux HLS early (e.g. during bumper). Autoplay when preloadOnly flips false.
 */
export function useTheaterHls({
  mediaElement,
  playbackId,
  preloadOnly,
  isMuted,
  onFatalError,
  filmTitle,
}: Args) {
  const hlsRef = useRef<Hls | null>(null);
  const [isMediaReady, setIsMediaReady] = useState(false);
  const preloadOnlyRef = useRef(preloadOnly);
  const isMutedRef = useRef(isMuted);
  preloadOnlyRef.current = preloadOnly;
  isMutedRef.current = isMuted;

  const onFatalErrorRef = useRef(onFatalError);
  onFatalErrorRef.current = onFatalError;

  // Attach whenever we have both a DOM node and a playback id.
  useEffect(() => {
    if (!mediaElement || !playbackId) {
      setIsMediaReady(false);
      return;
    }

    setIsMediaReady(false);
    mediaElement.muted = isMutedRef.current;

    const hlsUrl = `https://stream.mux.com/${playbackId}.m3u8`;
    let cancelled = false;

    const markReady = () => {
      if (cancelled) return;
      setIsMediaReady(true);
      if (!preloadOnlyRef.current) {
        mediaElement.muted = isMutedRef.current;
        mediaElement.play().catch(() => {});
      }
    };

    if (mediaElement.canPlayType('application/vnd.apple.mpegurl')) {
      mediaElement.src = hlsUrl;
      mediaElement.load();
      const onMeta = () => markReady();
      if (mediaElement.readyState >= 1) markReady();
      else mediaElement.addEventListener('loadedmetadata', onMeta, { once: true });
      return () => {
        cancelled = true;
        mediaElement.removeEventListener('loadedmetadata', onMeta);
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
        mediaElement.removeAttribute('src');
        mediaElement.load();
      };
    }

    let hls: Hls | null = null;

    import('hls.js')
      .then(({ default: Hls }) => {
        if (cancelled) return;
        if (!Hls.isSupported()) {
          mediaElement.src = `https://stream.mux.com/${playbackId}/high.mp4`;
          mediaElement.load();
          markReady();
          return;
        }

        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 30,
          startLevel: -1,
        });
        hlsRef.current = hls;
        hls.loadSource(hlsUrl);
        hls.attachMedia(mediaElement);
        hls.on(Hls.Events.MANIFEST_PARSED, () => markReady());
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal) return;
          console.error('HLS fatal error:', data);
          onFatalErrorRef.current?.(`${data.type}:${data.details}`);
        });
      })
      .catch((err) => {
        console.error('Failed to load hls.js:', err);
        if (cancelled) return;
        mediaElement.src = `https://stream.mux.com/${playbackId}/high.mp4`;
        mediaElement.load();
        markReady();
      });

    return () => {
      cancelled = true;
      if (hls) {
        hls.destroy();
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [mediaElement, playbackId]);

  // When bumper ends, play the already-attached stream.
  useEffect(() => {
    if (!mediaElement || preloadOnly || !isMediaReady) return;
    mediaElement.muted = isMuted;
    mediaElement.play().catch(() => {});
  }, [mediaElement, preloadOnly, isMediaReady, isMuted]);

  // Optional Mux Data via litix script when env key is set.
  useEffect(() => {
    const envKey = process.env.NEXT_PUBLIC_MUX_DATA_ENV_KEY;
    if (!envKey || !playbackId || !mediaElement || !isMediaReady) return;

    const w = window as unknown as {
      mux?: {
        monitor: (
          video: HTMLVideoElement,
          opts: { data: Record<string, string>; debug?: boolean }
        ) => void;
      };
    };

    const monitor = () => {
      if (!w.mux?.monitor) return;
      try {
        w.mux.monitor(mediaElement, {
          debug: false,
          data: {
            env_key: envKey,
            video_title: String(filmTitle || playbackId),
            video_id: playbackId,
            player_name: 'Fjorr CinemaTheater',
          },
        });
      } catch (err) {
        console.warn('Mux Data monitor failed:', err);
      }
    };

    if (w.mux?.monitor) {
      monitor();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-fjorr-mux-data]');
    if (existing) {
      existing.addEventListener('load', monitor);
      return () => existing.removeEventListener('load', monitor);
    }

    const script = document.createElement('script');
    script.src = 'https://src.litix.io/core/4.js';
    script.async = true;
    script.dataset.fjorrMuxData = '1';
    script.onload = () => monitor();
    document.head.appendChild(script);
  }, [playbackId, filmTitle, mediaElement, isMediaReady]);

  return { isMediaReady, hlsRef };
}
