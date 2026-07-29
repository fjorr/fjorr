/**
 * Film Logs — watch ledger (Phase 1).
 * Viewer # counts every qualifying watch (anon + member).
 * Film log rows are members only.
 */

'use server';

import { createClient } from '@/lib/supabase/server';

export type FilmViewRecord = {
  viewer_number: number;
  recorded: boolean;
  user_id: string | null;
};

export type FilmLogEntry = {
  film_id: string;
  viewer_number: number;
  recorded_at: string;
  film_name: string;
  film_slug: string;
  film_poster: string | null;
};

/**
 * Allocate Viewer #N for this film.
 * Anonymous: increments counter only.
 * Signed-in: increments (if first time) and writes a Film Log record.
 */
export async function recordFilmView(
  filmId: string
): Promise<FilmViewRecord | null> {
  if (!filmId) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('record_film_view', {
    p_film_id: filmId,
  });

  if (error) {
    console.error('record_film_view failed:', error.message);
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;

  return {
    viewer_number: Number(row.viewer_number),
    recorded: Boolean(row.recorded),
    user_id: row.user_id ? String(row.user_id) : null,
  };
}

/** Viewer # for the signed-in member on this film, if logged. */
export async function getOwnViewerNumberForFilm(
  filmId: string
): Promise<number | null> {
  if (!filmId) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('film_view_record')
    .select('viewer_number')
    .eq('user_id', user.id)
    .eq('film_id', filmId)
    .maybeSingle();

  if (error) {
    console.error('getOwnViewerNumberForFilm failed:', error.message);
    return null;
  }

  const n = Number(data?.viewer_number);
  return Number.isFinite(n) && n >= 1 ? n : null;
}

/** Own Film Logs, newest first. */
export async function getOwnFilmLogs(): Promise<FilmLogEntry[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('film_view_record')
    .select(
      `
      film_id,
      viewer_number,
      recorded_at,
      film:film_id ( name, slug, blok_tall )
    `
    )
    .eq('user_id', user.id)
    .order('recorded_at', { ascending: false });

  if (error) {
    console.error('getOwnFilmLogs failed:', error.message);
    return [];
  }

  return (data || []).map((row: any) => ({
    film_id: row.film_id,
    viewer_number: Number(row.viewer_number),
    recorded_at: row.recorded_at,
    film_name: String(row.film?.name || 'Film'),
    film_slug: String(row.film?.slug || ''),
    film_poster: row.film?.blok_tall ? String(row.film.blok_tall) : null,
  }));
}

/** Public Film Logs for a member (RLS requires profile.is_public). */
export async function getPublicFilmLogs(
  userId: string
): Promise<FilmLogEntry[]> {
  if (!userId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('film_view_record')
    .select(
      `
      film_id,
      viewer_number,
      recorded_at,
      film:film_id ( name, slug, blok_tall )
    `
    )
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false });

  if (error) {
    console.error('getPublicFilmLogs failed:', error.message);
    return [];
  }

  return (data || []).map((row: any) => ({
    film_id: row.film_id,
    viewer_number: Number(row.viewer_number),
    recorded_at: row.recorded_at,
    film_name: String(row.film?.name || 'Film'),
    film_slug: String(row.film?.slug || ''),
    film_poster: row.film?.blok_tall ? String(row.film.blok_tall) : null,
  }));
}
