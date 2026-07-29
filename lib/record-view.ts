/**
 * Client-side view recording — fires once when watch threshold is met.
 * Counts anonymous + signed-in views toward Viewer #.
 * Film Log records only attach when signed in.
 */

import { createClient } from '@/lib/supabase/client';
import { recordFilmView } from '@/lib/film-record-actions';

/** Seconds of playback before a view counts toward Viewer #. */
export const VIEW_COUNT_SECONDS = 30;
const COMPLETE_RATIO = 0.92;
const LOCAL_KEY = 'fjorr:view-counted';
export const FILM_RECORDED_EVENT = 'fjorr-film-recorded';

const sessionDone = new Set<string>();
const inflight = new Set<string>();

function shouldCount(
  seconds: number,
  duration?: number | null,
  force = false
): boolean {
  if (force) return true;
  if (seconds >= VIEW_COUNT_SECONDS) return true;
  if (duration && duration > 0 && seconds / duration >= COMPLETE_RATIO) {
    return true;
  }
  return false;
}

function readLocalCounted(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function markLocalCounted(filmId: string, viewerNumber: number) {
  if (typeof window === 'undefined') return;
  try {
    const map = readLocalCounted();
    map[filmId] = viewerNumber;
    localStorage.setItem(LOCAL_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function hasLocalCounted(filmId: string) {
  return filmId in readLocalCounted();
}

/** Record this film view if the viewer has watched enough (or force on ended). */
export function maybeRecordFilmView(
  filmId: string,
  seconds: number,
  duration?: number | null,
  force = false
) {
  if (!filmId) return;
  if (typeof window === 'undefined') return;
  if (sessionDone.has(filmId) || inflight.has(filmId)) return;
  if (!shouldCount(seconds, duration, force)) return;

  inflight.add(filmId);

  void (async () => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Anonymous: once per browser. Signed-in: always try (idempotent record).
      if (!session && hasLocalCounted(filmId)) {
        sessionDone.add(filmId);
        return;
      }

      const row = await recordFilmView(filmId);
      if (row) {
        markLocalCounted(filmId, row.viewer_number);
        sessionDone.add(filmId);
        try {
          window.dispatchEvent(
            new CustomEvent(FILM_RECORDED_EVENT, {
              detail: {
                filmId,
                viewerNumber: row.viewer_number,
                recorded: row.recorded,
              },
            })
          );
        } catch {
          /* ignore */
        }
      }
    } finally {
      inflight.delete(filmId);
    }
  })();
}

/** Mark a film already recorded this session. */
export function rememberRecordedFilm(filmId: string) {
  if (filmId) sessionDone.add(filmId);
}
