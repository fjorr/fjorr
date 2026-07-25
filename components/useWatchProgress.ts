'use client';

import { useEffect, useState } from 'react';
import {
  getWatchProgress,
  isWatchableProgress,
  listWatchProgress,
  subscribeWatchProgress,
  type WatchProgress,
} from '@/lib/watch-progress';

/** Live progress for one film (null if none / finished). */
export function useWatchProgress(filmId?: string | null, durationHint?: number | null) {
  const [progress, setProgress] = useState<WatchProgress | null>(null);

  useEffect(() => {
    if (!filmId) {
      setProgress(null);
      return;
    }
    const sync = () => {
      const next = getWatchProgress(filmId);
      setProgress(isWatchableProgress(next, durationHint) ? next : null);
    };
    sync();
    return subscribeWatchProgress(sync);
  }, [filmId, durationHint]);

  return progress;
}

/** Map of filmId → progress for poster grids. */
export function useWatchProgressMap() {
  const [map, setMap] = useState<Record<string, WatchProgress>>({});

  useEffect(() => {
    const sync = () => {
      const next: Record<string, WatchProgress> = {};
      for (const entry of listWatchProgress()) {
        if (isWatchableProgress(entry)) next[entry.filmId] = entry;
      }
      setMap(next);
    };
    sync();
    return subscribeWatchProgress(sync);
  }, []);

  return map;
}
