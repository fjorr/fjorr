/**
 * Local continue-watching progress (no accounts — privacy-aligned).
 * Keyed by film id in localStorage.
 * Signed-in Film Logs are a separate ledger (see record-view.ts).
 */

import { maybeRecordFilmView } from '@/lib/record-view';

export type WatchProgress = {
  filmId: string;
  slug: string;
  seconds: number;
  duration?: number;
  updatedAt: number;
};

const STORAGE_KEY = 'fjorr:watch-progress';
const MIN_SECONDS = 20;
/** Treat as finished — clear progress so Play starts fresh. */
const COMPLETE_RATIO = 0.92;
const THROTTLE_MS = 4000;
const CHANGE_EVENT = 'fjorr-watch-progress';

const lastWriteByFilm = new Map<string, number>();

function canUseStorage() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function readAll(): Record<string, WatchProgress> {
  if (!canUseStorage()) return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, WatchProgress>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, WatchProgress>) {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // Quota / private mode — ignore.
  }
}

export function getWatchProgress(filmId: string): WatchProgress | null {
  if (!filmId) return null;
  return readAll()[filmId] ?? null;
}

export function listWatchProgress(): WatchProgress[] {
  return Object.values(readAll()).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function clearWatchProgress(filmId: string) {
  if (!filmId || !canUseStorage()) return;
  const map = readAll();
  if (!(filmId in map)) return;
  delete map[filmId];
  writeAll(map);
  lastWriteByFilm.delete(filmId);
}

/** Clear local resume + try to record a Film Log / viewer count on ended. */
export function finishWatchProgress(filmId: string) {
  if (!filmId) return;
  clearWatchProgress(filmId);
  maybeRecordFilmView(filmId, Number.POSITIVE_INFINITY, 1, true);
}

export function isWatchableProgress(
  progress: WatchProgress | null | undefined,
  durationHint?: number | null
): progress is WatchProgress {
  if (!progress || progress.seconds < MIN_SECONDS) return false;
  const duration = progress.duration ?? durationHint ?? 0;
  if (duration > 0 && progress.seconds / duration >= COMPLETE_RATIO) return false;
  return true;
}

/** mm:ss for resume labels */
export function formatResumeClock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, '0')}`;
}

/**
 * Persist playback position (throttled). Clears when near the end.
 * Also records a viewer count / Film Log when the watch threshold is met.
 */
export function trackWatchProgress(input: {
  filmId: string;
  slug: string;
  seconds: number;
  duration?: number | null;
}) {
  const { filmId, slug, seconds, duration } = input;
  if (!filmId || !slug) return;

  const dur = duration && duration > 0 ? duration : undefined;

  if (dur && seconds / dur >= COMPLETE_RATIO) {
    clearWatchProgress(filmId);
    maybeRecordFilmView(filmId, seconds, dur);
    return;
  }

  maybeRecordFilmView(filmId, seconds, dur);

  if (!canUseStorage()) return;
  if (seconds < MIN_SECONDS) return;

  const now = Date.now();
  const last = lastWriteByFilm.get(filmId) ?? 0;
  if (now - last < THROTTLE_MS) return;
  lastWriteByFilm.set(filmId, now);

  const map = readAll();
  map[filmId] = {
    filmId,
    slug,
    seconds: Math.floor(seconds),
    duration: dur,
    updatedAt: now,
  };
  writeAll(map);
}

export function subscribeWatchProgress(onChange: () => void) {
  if (!canUseStorage()) return () => {};
  const handler = () => onChange();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}
