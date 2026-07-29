/**
 * Client-side view recording — fires once when watch threshold is met.
 * Counts anonymous + signed-in views toward Viewer #.
 * Film Log records only attach when signed in.
 *
 * Uses the browser Supabase client (same session as Account menu).
 */

import { createClient } from '@/lib/supabase/client';

/** Seconds of playback before a view counts toward Viewer #. */
export const VIEW_COUNT_SECONDS = 10;
const COMPLETE_RATIO = 0.9;
const LOCAL_KEY = 'fjorr:view-counted';
export const FILM_RECORDED_EVENT = 'fjorr-film-recorded';

const sessionDone = new Set<string>();
const sessionLogged = new Set<string>();
const inflight = new Set<string>();

export function viewCountThreshold(duration?: number | null) {
  if (duration && duration > 0 && duration < 40) {
    return Math.max(5, Math.floor(duration * 0.4));
  }
  return VIEW_COUNT_SECONDS;
}

function shouldCount(
  seconds: number,
  duration?: number | null,
  force = false
): boolean {
  if (force) return true;
  if (!Number.isFinite(seconds) || seconds < 0) return false;
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

function emitRecorded(
  filmId: string,
  viewerNumber: number,
  recorded: boolean
) {
  try {
    window.dispatchEvent(
      new CustomEvent(FILM_RECORDED_EVENT, {
        detail: { filmId, viewerNumber, recorded },
      })
    );
  } catch {
    /* ignore */
  }
}

/** Record this film view if the viewer has watched enough (or force on ended). */
export function maybeRecordFilmView(
  filmId: string,
  seconds: number,
  duration?: number | null,
  force = false
) {
  const id = String(filmId || '').trim();
  if (!id || id === 'undefined' || id === 'null') return;
  if (typeof window === 'undefined') return;
  if (inflight.has(id) || sessionLogged.has(id)) return;
  if (!shouldCount(seconds, duration, force)) return;

  // Anon already counted this browser — only retry when we might attach a Film Log.
  if (sessionDone.has(id) && !force) return;

  inflight.add(id);

  void (async () => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const signedIn = Boolean(session?.user);

      // Already counted as anon this browser: skip unless signed in (need Film Log).
      if (!signedIn && id in readLocalCounted()) {
        sessionDone.add(id);
        return;
      }

      const { data, error } = await supabase.rpc('record_film_view', {
        p_film_id: id,
      });

      if (error) {
        console.error('[fjorr] record_film_view failed:', error.message);
        return;
      }

      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        console.error('[fjorr] record_film_view empty result');
        return;
      }

      const viewerNumber = Number(row.viewer_number);
      const recorded = Boolean(row.recorded);

      if (Number.isFinite(viewerNumber) && viewerNumber >= 1) {
        markLocalCounted(id, viewerNumber);
      }

      if (recorded) {
        sessionLogged.add(id);
        sessionDone.add(id);
      } else if (!signedIn) {
        sessionDone.add(id);
      } else {
        // Signed in but no Film Log row — allow retry next tick.
        console.error('[fjorr] signed in but recorded=false', id, row);
      }

      emitRecorded(id, viewerNumber, recorded);
    } catch (err) {
      console.error('[fjorr] record film view failed:', err);
    } finally {
      inflight.delete(id);
    }
  })();
}

/** Mark a film already recorded this session. */
export function rememberRecordedFilm(filmId: string) {
  const id = String(filmId || '').trim();
  if (id) {
    sessionDone.add(id);
    sessionLogged.add(id);
  }
}
