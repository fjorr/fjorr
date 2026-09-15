'use client';

import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';

const POSTER_HOLD_MS = 2800;
const PREVIEW_MS = 8000;
const FADE_MS = 700;

/** Pick a mid-film tease without a curated preview asset. */
export function previewStartSeconds(runtime?: number | null): number {
  const dur = runtime && runtime > 0 ? runtime : 120;
  if (dur <= 20) return Math.min(2, Math.max(0, dur * 0.4));
  // Mid-film (~50%), leave room for the clip.
  return Math.min(Math.max(dur * 0.5, 5), Math.max(5, dur - 10));
}

type Props = {
  poster: string | null;
  playbackId?: string | null;
  runtime?: number | null;
  active: boolean;
  paused?: boolean;
  /** LCP — priority fetch for the active slide poster. */
  priority?: boolean;
  className?: string;
};

/**
 * Poster → muted tease from the same Mux HLS stream (no extra asset).
 * Uses hls.js on Chromium; native HLS only when MSE/hls.js is unavailable (Safari).
 * Poster goes through next/image + Cloudflare loader for LCP width variants.
 */
export default function HouseHeroPreview({
  poster,
  playbackId,
  runtime,
  active,
  paused = false,
  priority = false,
  className = '',
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<{ destroy: () => void } | null>(null);
  const timersRef = useRef<number[]>([]);
  const teasedForRef = useRef<string | null>(null);
  const [videoOn, setVideoOn] = useState(false);
  const [canPreview, setCanPreview] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setCanPreview(!mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    const onVis = () => setPageVisible(!document.hidden);
    onVis();
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    const clearTimers = () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };

    const destroyStream = () => {
      clearTimers();
      const video = videoRef.current;
      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      setVideoOn(false);
    };

    if (!active) {
      teasedForRef.current = null;
      destroyStream();
      return;
    }

    if (paused || !pageVisible) {
      clearTimers();
      videoRef.current?.pause();
      setVideoOn(false);
      return;
    }

    if (!canPreview || !playbackId) {
      destroyStream();
      return;
    }

    if (teasedForRef.current === playbackId) {
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    const startAt = previewStartSeconds(runtime);
    const hlsUrl = `https://stream.mux.com/${playbackId}.m3u8`;

    const finishTeaseLater = () => {
      const stopId = window.setTimeout(() => {
        if (cancelled) return;
        setVideoOn(false);
        video.pause();
        const clearId = window.setTimeout(() => {
          if (cancelled) return;
          destroyStream();
          teasedForRef.current = playbackId;
        }, FADE_MS + 80);
        timersRef.current.push(clearId);
      }, PREVIEW_MS);
      timersRef.current.push(stopId);
    };

    const playClip = () => {
      if (cancelled || !video) return;
      teasedForRef.current = playbackId;
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.volume = 0;

      const onPlaying = () => {
        if (cancelled) return;
        setVideoOn(true);
        finishTeaseLater();
      };
      video.addEventListener('playing', onPlaying, { once: true });

      void video.play().catch(() => {
        video.removeEventListener('playing', onPlaying);
        teasedForRef.current = null;
      });
    };

    const seekThenPlay = () => {
      if (cancelled || !video) return;
      const dur = video.duration;
      const t =
        Number.isFinite(dur) && dur > 0
          ? Math.min(startAt, Math.max(0, dur - 12))
          : startAt;

      // Already near target (hls startPosition) — play.
      if (Math.abs(video.currentTime - t) <= 0.5 || t <= 0.25) {
        playClip();
        return;
      }

      let settled = false;
      const go = () => {
        if (settled || cancelled) return;
        settled = true;
        video.removeEventListener('seeked', go);
        window.clearTimeout(fallbackId);
        playClip();
      };
      const fallbackId = window.setTimeout(go, 2000);
      timersRef.current.push(fallbackId);
      video.addEventListener('seeked', go);
      try {
        video.currentTime = t;
      } catch {
        go();
      }
    };

    const whenMeta = (fn: () => void) => {
      if (video.readyState >= 1 && Number.isFinite(video.duration)) fn();
      else {
        const onMeta = () => {
          video.removeEventListener('loadedmetadata', onMeta);
          fn();
        };
        video.addEventListener('loadedmetadata', onMeta);
      }
    };

    const holdId = window.setTimeout(() => {
      if (cancelled) return;

      const startStream = () => {
        if (cancelled) return;
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');

        void import('hls.js')
          .then(({ default: Hls }) => {
            if (cancelled) return;

            // Chromium reports canPlayType("…mpegurl") as "maybe" but cannot
            // play HLS without MSE — prefer hls.js whenever it is supported.
            if (Hls.isSupported()) {
              const hls = new Hls({
                enableWorker: true,
                maxBufferLength: 12,
                maxMaxBufferLength: 20,
                // Auto ABR — startLevel: 0 forced potato then upswitch (blurry tease).
                startLevel: -1,
                startPosition: startAt,
              });
              hlsRef.current = hls;
              hls.loadSource(hlsUrl);
              hls.attachMedia(video);
              hls.on(Hls.Events.MANIFEST_PARSED, () => {
                if (!cancelled) whenMeta(() => playClip());
              });
              hls.on(Hls.Events.ERROR, (_event, data) => {
                if (!data?.fatal || cancelled) return;
                console.warn('House preview HLS error:', data.type, data.details);
                teasedForRef.current = null;
                destroyStream();
              });
              return;
            }

            if (video.canPlayType('application/vnd.apple.mpegurl')) {
              video.src = hlsUrl;
              video.load();
              whenMeta(seekThenPlay);
              return;
            }

            teasedForRef.current = null;
          })
          .catch(() => {
            teasedForRef.current = null;
          });
      };

      // Prefer idle time so LCP poster paint wins the network.
      const ric = (
        window as Window & {
          requestIdleCallback?: (
            cb: () => void,
            opts?: { timeout: number }
          ) => number;
        }
      ).requestIdleCallback;
      if (typeof ric === 'function') {
        ric(startStream, { timeout: 1200 });
      } else {
        startStream();
      }
    }, POSTER_HOLD_MS);
    timersRef.current.push(holdId);

    return () => {
      cancelled = true;
      destroyStream();
    };
  }, [active, paused, pageVisible, canPreview, playbackId, runtime]);

  const eager = Boolean(priority && active);

  return (
    <div className={`absolute inset-0 overflow-hidden bg-black ${className}`}>
      {poster ? (
        <Image
          src={poster}
          alt=""
          fill
          sizes="100vw"
          priority={eager}
          fetchPriority={eager ? 'high' : 'auto'}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      ) : null}
      <video
        ref={videoRef}
        muted
        playsInline
        preload="none"
        aria-hidden
        className={`pointer-events-none absolute inset-0 h-full w-full object-cover object-center transition-opacity ease-out ${
          videoOn ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ transitionDuration: `${FADE_MS}ms` }}
      />
    </div>
  );
}
