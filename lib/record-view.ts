/**
 * Client-side view recording — fires once when watch threshold is met.
 * Counts anonymous + signed-in views toward Viewer #.
 * Film Log records only attach when signed in.
 *
 * Posts to /api/film-view so the server cookie session is used (auth.uid()).
 */

/** Seconds of playback before a view counts toward Viewer #. */
export const VIEW_COUNT_SECONDS = 15;
const COMPLETE_RATIO = 0.92;
const LOCAL_KEY = 'fjorr:view-counted';
export const FILM_RECORDED_EVENT = 'fjorr-film-recorded';

const sessionDone = new Set<string>();
const sessionLogged = new Set<string>();
const inflight = new Set<string>();

/** For very short films, require roughly half the runtime (min 8s). */
export function viewCountThreshold(duration?: number | null) {
  if (duration && duration > 0 && duration < VIEW_COUNT_SECONDS * 2) {
    return Math.max(8, Math.floor(duration * 0.45));
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
  if (!id) return;
  if (typeof window === 'undefined') return;
  if (inflight.has(id) || sessionLogged.has(id) || sessionDone.has(id)) return;
  if (!shouldCount(seconds, duration, force)) return;

  // Anonymous browser already counted in a prior visit — skip new Viewer #
  // increments, but still try once so a signed-in member gets a Film Log.
  const alreadyLocal = hasLocalCounted(id);

  inflight.add(id);

  void (async () => {
    try {
      const res = await fetch('/api/film-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ filmId: id }),
      });

      if (!res.ok) {
        console.error('record film view HTTP', res.status, await res.text());
        return;
      }

      const row = (await res.json()) as {
        viewer_number?: number;
        recorded?: boolean;
        signed_in?: boolean;
      };

      const viewerNumber = Number(row.viewer_number);
      const recorded = Boolean(row.recorded);

      if (Number.isFinite(viewerNumber) && viewerNumber >= 1) {
        markLocalCounted(id, viewerNumber);
      }

      if (recorded) {
        sessionLogged.add(id);
        sessionDone.add(id);
      } else if (row.signed_in) {
        // Signed in but RPC returned recorded=false — unexpected; allow retry.
        console.error('film view signed in but not recorded', id);
      } else if (alreadyLocal) {
        // Still anonymous; don't keep burning Viewer #s.
        sessionDone.add(id);
      } else {
        sessionDone.add(id);
      }

      emitRecorded(id, viewerNumber, recorded);
    } catch (err) {
      console.error('record film view failed:', err);
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
