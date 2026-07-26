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
        'id, name, slug, mux_playback_id, last_line, story_date, location, runtime, has_subtitles'
      )
      .eq('slug', slug)
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
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
}: OpenArgs) {
  const saved = getWatchProgress(film.id);
  const canResume = isWatchableProgress(saved, film.runtime);
  if (requireProgress && !canResume) return;

  setStartAt(canResume ? saved.seconds : undefined);
  setSelectedFilm({
    ...film,
    language_subtitle: film.language_subtitle ?? [],
  });
  setShowTheater(true);

  void (async () => {
    let next: TheaterFilmPayload = { ...film };

    if (!next.mux_playback_id && next.slug) {
      const verified = await fetchFilmPlayback(next.slug);
      if (verified) {
        next = { ...next, ...verified };
        setSelectedFilm({
          ...next,
          language_subtitle: next.language_subtitle ?? [],
        });
        const savedAfter = getWatchProgress(next.id);
        if (isWatchableProgress(savedAfter, next.runtime)) {
          setStartAt(savedAfter.seconds);
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
