'use client';

import { useEffect, useState } from 'react';

export type MuxStoryboardTile = {
  start: number;
  x: number;
  y: number;
};

export type MuxStoryboard = {
  url: string;
  tileWidth: number;
  tileHeight: number;
  duration: number;
  tiles: MuxStoryboardTile[];
  /** Full sprite sheet pixel size (derived from tile positions). */
  sheetWidth: number;
  sheetHeight: number;
};

type StoryboardJson = {
  url?: string;
  tile_width?: number;
  tile_height?: number;
  duration?: number;
  tiles?: { start?: number; x?: number; y?: number }[];
};

/**
 * Load Mux timeline storyboard (sprite sheet + tile map) for a playback id.
 * Public playback IDs only — signed assets need a token (not wired here).
 */
export function useMuxStoryboard(playbackId: string | null | undefined) {
  const [storyboard, setStoryboard] = useState<MuxStoryboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = String(playbackId || '').trim();
    if (!id) {
      setStoryboard(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setStoryboard(null);
    setError(null);

    void (async () => {
      try {
        const res = await fetch(
          `https://image.mux.com/${encodeURIComponent(id)}/storyboard.json?format=webp`
        );
        if (!res.ok) throw new Error(`storyboard ${res.status}`);
        const raw = (await res.json()) as StoryboardJson;
        const tileWidth = Number(raw.tile_width) || 0;
        const tileHeight = Number(raw.tile_height) || 0;
        const tiles = (raw.tiles || [])
          .map((t) => ({
            start: Number(t.start) || 0,
            x: Number(t.x) || 0,
            y: Number(t.y) || 0,
          }))
          .filter((t) => Number.isFinite(t.start));
        if (!raw.url || !tileWidth || !tileHeight || tiles.length === 0) {
          throw new Error('storyboard incomplete');
        }
        let maxX = 0;
        let maxY = 0;
        for (const t of tiles) {
          maxX = Math.max(maxX, t.x + tileWidth);
          maxY = Math.max(maxY, t.y + tileHeight);
        }
        if (cancelled) return;
        setStoryboard({
          url: raw.url,
          tileWidth,
          tileHeight,
          duration: Number(raw.duration) || 0,
          tiles,
          sheetWidth: maxX,
          sheetHeight: maxY,
        });
      } catch (e) {
        if (cancelled) return;
        setStoryboard(null);
        setError(e instanceof Error ? e.message : 'storyboard failed');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [playbackId]);

  return { storyboard, error };
}
