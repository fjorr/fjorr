'use client';

import { createClient } from '@/lib/supabase/client';
import {
  getWatchProgress,
  isWatchableProgress,
} from '@/lib/watch-progress';

export type TheaterSubtitleTrack = {
  code: string;
  name: string;
  vtt_url: string;
};

export type TheaterFilmPayload = {
  id: string;
  name?: string | null;
  slug: string;
  mux_playback_id?: string | null;
  last_line?: string | null;
  last_line_attribution?: string | null;
  story_date?: string | null;
  location?: string | null;
  runtime?: number | null;
  has_subtitles?: boolean | null;
  language_subtitle?: TheaterSubtitleTrack[];
  sponsor?: string | null;
};

type OpenArgs = {
  film: TheaterFilmPayload;
  setSelectedFilm: (film: TheaterFilmPayload) => void;
  setStartAt: (seconds: number | undefined) => void;
  setShowTheater: (open: boolean) => void;
  /** When true, only open if saved progress is watchable (Time resume). */
  requireProgress?: boolean;
  /**
   * Explicit start time (transcript cue, deep link, etc.).
   * Wins over saved watch progress — including async hydration.
   */
  startAt?: number;
};

async function fetchSubtitleTracks(
  filmId: string,
  hasSubtitles?: boolean | null
): Promise<TheaterSubtitleTrack[]> {
  if (hasSubtitles === false) return [];
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('language_subtitle')
      .select(
        `
        vtt_url,
        language (
          code,
          name
        )
      `
      )
      .eq('film_id', filmId);

    return (data || []).map((track: any) => ({
      code: track.language?.code || 'en',
      name: track.language?.name || 'English',
      vtt_url: track.vtt_url || '',
    }));
  } catch {
    return [];
  }
}

async function fetchFilmPlayback(slug: string): Promise<TheaterFilmPayload | null> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('film')
      .select(
        'id, name, slug, mux_playback_id, last_line, last_line_attribution, story_date, location, runtime, has_subtitles'
      )
      .eq('slug', slug)
      .maybeSingle();
    if (!data) return null;
    return {
      ...data,
      location: formatTheaterLocation(data.location),
    };
  } catch {
    return null;
  }
}

function formatTheaterLocation(raw: unknown): string | null {
  if (!raw) return null;
  if (typeof raw === 'string') return raw.trim() || null;
  if (Array.isArray(raw)) {
    const parts = raw.map((v) => String(v).trim()).filter(Boolean);
    return parts.length ? parts.join(', ') : null;
  }
  return null;
}

/**
 * Open the theater immediately from list/rail props; hydrate mux id +
 * subtitle tracks in the background so Play never waits on a round-trip.
 */
export function openTheaterFromFilm({
  film,
  setSelectedFilm,
  setStartAt,
  setShowTheater,
  requireProgress = false,
  startAt,
}: OpenArgs) {
  const hasExplicitStart = typeof startAt === 'number' && startAt >= 0;
  const saved = getWatchProgress(film.id);
  const canResume = isWatchableProgress(saved, film.runtime);
  if (requireProgress && !canResume) return;

  setStartAt(hasExplicitStart ? startAt : canResume ? saved.seconds : undefined);
  setSelectedFilm({
    ...film,
    location: formatTheaterLocation(film.location) ?? film.location ?? null,
    language_subtitle: film.language_subtitle ?? [],
  });
  setShowTheater(true);

  void (async () => {
    let next: TheaterFilmPayload = {
      ...film,
      location: formatTheaterLocation(film.location) ?? film.location ?? null,
    };

    const needsPlaybackMeta =
      !next.mux_playback_id || !next.location || !next.story_date;
    // End card: last_line + attribution — always fill from film row when missing.
    const needsEndCard =
      next.last_line == null || next.last_line_attribution == null;

    if (needsPlaybackMeta || needsEndCard) {
      const verified = await fetchFilmPlayback(next.slug);
      if (verified) {
        next = {
          ...next,
          ...verified,
          mux_playback_id: next.mux_playback_id || verified.mux_playback_id,
          location: next.location || verified.location,
          story_date: next.story_date || verified.story_date,
          last_line: next.last_line ?? verified.last_line,
          last_line_attribution:
            next.last_line_attribution ?? verified.last_line_attribution,
        };
        setSelectedFilm({
          ...next,
          language_subtitle: next.language_subtitle ?? [],
        });
        // Don't clobber an intentional cue/share seek with resume progress.
        if (!hasExplicitStart) {
          const savedAfter = getWatchProgress(next.id);
          if (isWatchableProgress(savedAfter, next.runtime)) {
            setStartAt(savedAfter.seconds);
          }
        }
      }
    }

    if ((next.language_subtitle?.length ?? 0) > 0) return;
    if (!next.id) return;

    const tracks = await fetchSubtitleTracks(next.id, next.has_subtitles);
    if (tracks.length === 0) return;

    setSelectedFilm({
      ...next,
      language_subtitle: tracks,
    });
  })();
}
