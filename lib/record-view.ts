/**
 * Client-side view recording — fires once when watch threshold is met.
 * Counts anonymous + signed-in views toward Viewer #.
 * Film Log records only attach when signed in.
 *
 * Uses the browser Supabase client (not a server action) so auth.uid() and
 * the call aren’t blocked by the site-password middleware.
 */

import { createClient } from '@/lib/supabase/client';

/** Default seconds of playback before a view counts toward Viewer #. */
export const VIEW_COUNT_SECONDS = 30;
const COMPLETE_RATIO = 0.92;
const LOCAL_KEY = 'fjorr:view-counted';
export const FILM_RECORDED_EVENT = 'fjorr-film-recorded';

const sessionDone = new Set<string>();
const sessionLogged = new Set<string>();
const inflight = new Set<string>();

/** For short films, require roughly half the runtime (min 10s). */
export function viewCountThreshold(duration?: number | null) {
  if (duration && duration > 0 && duration < VIEW_COUNT_SECONDS * 2) {
    return Math.max(10, Math.floor(duration * 0.5));
  }
  return VIEW_COUNT_SECONDS;
}

function shouldCount(
  seconds: number,
  duration?: number | null,
  force = false
): boolean {
  if (force) return true;
  if (seconds >= viewCountThreshold(duration)) return true;
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
  if (inflight.has(filmId)) return;
  if (!shouldCount(seconds, duration, force)) return;

  inflight.add(filmId);

  void (async () => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const signedIn = Boolean(session?.user);

      // Already wrote a Film Log this session — nothing left to do.
      if (signedIn && sessionLogged.has(filmId)) return;

      // Anonymous: once per browser (and skip if we already counted this tab).
      if (!signedIn) {
        if (sessionDone.has(filmId) || hasLocalCounted(filmId)) {
          sessionDone.add(filmId);
          return;
        }
      }

      const { data, error } = await supabase.rpc('record_film_view', {
        p_film_id: filmId,
      });

      if (error) {
        console.error('record_film_view failed:', error.message);
        return;
      }

      const row = Array.isArray(data) ? data[0] : data;
      if (!row) return;

      const viewerNumber = Number(row.viewer_number);
      const recorded = Boolean(row.recorded);

      if (Number.isFinite(viewerNumber) && viewerNumber >= 1) {
        markLocalCounted(filmId, viewerNumber);
      }
      sessionDone.add(filmId);
      if (signedIn && recorded) sessionLogged.add(filmId);

      try {
        window.dispatchEvent(
          new CustomEvent(FILM_RECORDED_EVENT, {
            detail: {
              filmId,
              viewerNumber,
              recorded,
            },
          })
        );
      } catch {
        /* ignore */
      }
    } finally {
      inflight.delete(filmId);
    }
  })();
}

/** Mark a film already recorded this session. */
export function rememberRecordedFilm(filmId: string) {
  if (filmId) {
    sessionDone.add(filmId);
    sessionLogged.add(filmId);
  }
}
