/**
 * Client-side view recording — fires once when watch threshold is met.
 * Posts to /api/film-view with the browser access token so auth.uid() sticks.
 */

import { createClient } from '@/lib/supabase/client';

/** Seconds of playback before a view counts toward Viewer #. */
export const VIEW_COUNT_SECONDS = 8;
const COMPLETE_RATIO = 0.9;
const LOCAL_KEY = 'fjorr:view-counted';
export const FILM_RECORDED_EVENT = 'fjorr-film-recorded';

const doneIds = new Set<string>();
const loggedIds = new Set<string>();
const pendingIds = new Set<string>();

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
  recorded: boolean,
  firstStamp: boolean
) {
  try {
    window.dispatchEvent(
      new CustomEvent(FILM_RECORDED_EVENT, {
        detail: { filmId, viewerNumber, recorded, firstStamp },
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
  if (pendingIds.has(id) || loggedIds.has(id)) return;
  if (!force && doneIds.has(id)) return;
  if (!shouldCount(seconds, duration, force)) return;

  pendingIds.add(id);

  void (async () => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token || '';
      const signedIn = Boolean(session?.user);
      const hadLocalStamp = id in readLocalCounted();

      if (!signedIn && hadLocalStamp) {
        doneIds.add(id);
        return;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

      const res = await fetch('/api/film-view', {
        method: 'POST',
        headers,
        credentials: 'same-origin',
        body: JSON.stringify({ filmId: id }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('[fjorr] film-view HTTP', res.status, text);
        return;
      }

      const row = (await res.json()) as {
        viewer_number?: number;
        recorded?: boolean;
        signed_in?: boolean;
      };

      const viewerNumber = Number(row.viewer_number);
      const recorded = Boolean(row.recorded);
      const firstStamp =
        !hadLocalStamp && Number.isFinite(viewerNumber) && viewerNumber >= 1;

      if (Number.isFinite(viewerNumber) && viewerNumber >= 1) {
        markLocalCounted(id, viewerNumber);
      }

      if (recorded) {
        loggedIds.add(id);
        doneIds.add(id);
      } else if (!signedIn && !row.signed_in) {
        doneIds.add(id);
      } else {
        console.error('[fjorr] expected Film Log but recorded=false', id, row);
      }

      emitRecorded(id, viewerNumber, recorded, firstStamp);
    } catch (err) {
      console.error('[fjorr] record film view failed:', err);
    } finally {
      pendingIds.delete(id);
    }
  })();
}

/** Mark a film already recorded this session. */
export function rememberRecordedFilm(filmId: string) {
  const id = String(filmId || '').trim();
  if (id) {
    doneIds.add(id);
    loggedIds.add(id);
  }
}
