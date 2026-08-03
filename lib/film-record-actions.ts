/**
 * Voyages — watch ledger.
 * Viewer # counts every qualifying watch (anon + member).
 * Voyage rows are members only (optional referred_by frozen at first log).
 */

'use server';

import { createClient } from '@/lib/supabase/server';

export type FilmViewRecord = {
  viewer_number: number;
  recorded: boolean;
  user_id: string | null;
  /** Cut number at record time (Plus Machine). */
  film_version: number;
  film_version_id: string | null;
  referred_by_user_id: string | null;
};

export type FilmLogEntry = {
  film_id: string;
  viewer_number: number;
  recorded_at: string;
  /** Cut this member watched when the log was stamped. Frozen. */
  film_version: number;
  film_version_id: string | null;
  /** Changelog of the cut they watched, if any. */
  film_version_changelog: string | null;
  /** Who passed this film (member #). Null = organic root. */
  referred_by_member_number: number | null;
  /** How many members this voyager directly passed this film to. Own ledger only. */
  passed_on_count: number;
  film_name: string;
  film_slug: string;
  film_poster: string | null;
  /** Runtime in seconds (film table). */
  film_runtime: number | null;
  /** ISO date or null. */
  film_release_date: string | null;
  film_theme: string | null;
};

function mapFilmLogRow(
  row: any,
  passCounts: Record<string, number> = {}
): FilmLogEntry {
  const film = Array.isArray(row.film) ? row.film[0] : row.film;
  const cut = Array.isArray(row.cut) ? row.cut[0] : row.cut;
  const theme = film?.theme
    ? Array.isArray(film.theme)
      ? film.theme[0]
      : film.theme
    : null;
  const runtime = Number(film?.runtime);
  const version = Number(row.film_version ?? cut?.version);
  const via = Number(row.referred_by_member_number);
  const filmId = String(row.film_id);
  return {
    film_id: filmId,
    viewer_number: Number(row.viewer_number),
    recorded_at: String(row.recorded_at),
    film_version: Number.isFinite(version) && version >= 1 ? version : 1,
    film_version_id: row.film_version_id ? String(row.film_version_id) : null,
    film_version_changelog: cut?.changelog ? String(cut.changelog) : null,
    referred_by_member_number:
      Number.isFinite(via) && via >= 1 ? via : null,
    passed_on_count: passCounts[filmId] || 0,
    film_name: String(film?.name || 'Film'),
    film_slug: String(film?.slug || ''),
    film_poster: film?.blok_tall ? String(film.blok_tall) : null,
    film_runtime: Number.isFinite(runtime) && runtime > 0 ? runtime : null,
    film_release_date: film?.release_date ? String(film.release_date) : null,
    film_theme: theme?.name ? String(theme.name) : null,
  };
}

/** Account Voyages UI — badge fields only. */
const ACCOUNT_FILM_LOG_SELECT = `
  film_id,
  viewer_number,
  recorded_at,
  film_version,
  film_version_id,
  referred_by_member_number,
  film:film_id (
    name,
    slug,
    blok_tall
  )
`;

/** Fuller select for public profiles / trail surfaces. */
const FILM_LOG_SELECT = `
  film_id,
  viewer_number,
  recorded_at,
  film_version,
  film_version_id,
  referred_by_member_number,
  cut:film_version_id (
    version,
    changelog,
    status
  ),
  film:film_id (
    name,
    slug,
    blok_tall,
    runtime,
    release_date,
    theme ( name, slug )
  )
`;

/**
 * Allocate Viewer #N for this film.
 * Prefer lib/record-view.ts from the browser; this remains for server callers.
 */
export async function recordFilmView(
  filmId: string,
  viaMemberNumber?: number | null
): Promise<FilmViewRecord | null> {
  if (!filmId) return null;

  const supabase = await createClient();
  const args: { p_film_id: string; p_referred_by_member_number?: number } = {
    p_film_id: filmId,
  };
  const via = Number(viaMemberNumber);
  if (Number.isFinite(via) && via >= 1) {
    args.p_referred_by_member_number = via;
  }

  const { data, error } = await supabase.rpc('record_film_view', args);

  if (error) {
    console.error('record_film_view failed:', error.message);
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;

  const version = Number(row.film_version);
  return {
    viewer_number: Number(row.viewer_number),
    recorded: Boolean(row.recorded),
    user_id: row.user_id ? String(row.user_id) : null,
    film_version: Number.isFinite(version) && version >= 1 ? version : 1,
    film_version_id: row.film_version_id ? String(row.film_version_id) : null,
    referred_by_user_id: row.referred_by_user_id
      ? String(row.referred_by_user_id)
      : null,
  };
}

/** Viewer # for the signed-in member on this film, if logged. */
export async function getOwnViewerNumberForFilm(
  filmId: string
): Promise<number | null> {
  const stamp = await getOwnVoyageurStampForFilm(filmId);
  return stamp?.voyageurNumber ?? null;
}

export type VoyageurStamp = {
  voyageurNumber: number;
  recordedAt: string;
  memberNumber: number;
  /** Cut watched when the log was stamped. */
  filmVersion: number;
  filmVersionId: string | null;
};

/** Own Voyageur stamp for a film — number + when + member # + cut (not a live total). */
export async function getOwnVoyageurStampForFilm(
  filmId: string
): Promise<VoyageurStamp | null> {
  if (!filmId) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: row, error }, { data: profile }] = await Promise.all([
    supabase
      .from('film_view_record')
      .select('viewer_number, recorded_at, film_version, film_version_id')
      .eq('user_id', user.id)
      .eq('film_id', filmId)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('member_number')
      .eq('id', user.id)
      .maybeSingle(),
  ]);

  if (error) {
    console.error('getOwnVoyageurStampForFilm failed:', error.message);
    return null;
  }

  const n = Number(row?.viewer_number);
  const memberNumber = Number(profile?.member_number);
  const filmVersion = Number(row?.film_version);
  if (!Number.isFinite(n) || n < 1) return null;
  if (!Number.isFinite(memberNumber) || memberNumber < 1) return null;
  if (!row?.recorded_at) return null;

  return {
    voyageurNumber: n,
    recordedAt: String(row.recorded_at),
    memberNumber,
    filmVersion: Number.isFinite(filmVersion) && filmVersion >= 1 ? filmVersion : 1,
    filmVersionId: row.film_version_id ? String(row.film_version_id) : null,
  };
}

const OWN_VOYAGE_LIMIT = 100;
const PUBLIC_VOYAGE_LIMIT = 100;

/**
 * Own Voyages, newest first. Pass userId to skip a second auth.getUser().
 * Account UI uses a slim select (no trail/theme/pass counts).
 */
export async function getOwnFilmLogs(
  userId?: string
): Promise<FilmLogEntry[]> {
  const supabase = await createClient();
  let uid = userId;
  if (!uid) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];
    uid = user.id;
  }

  const { data, error } = await supabase
    .from('film_view_record')
    .select(ACCOUNT_FILM_LOG_SELECT)
    .eq('user_id', uid)
    .order('recorded_at', { ascending: false })
    .limit(OWN_VOYAGE_LIMIT);

  if (error) {
    console.error('getOwnFilmLogs failed:', error.message);
    return [];
  }

  return (data || []).map((row) => mapFilmLogRow(row));
}

/** Public Voyages for a member (RLS requires profile.is_public). */
export async function getPublicFilmLogs(
  userId: string
): Promise<FilmLogEntry[]> {
  if (!userId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('film_view_record')
    .select(FILM_LOG_SELECT)
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false })
    .limit(PUBLIC_VOYAGE_LIMIT);

  if (error) {
    console.error('getPublicFilmLogs failed:', error.message);
    return [];
  }

  return (data || []).map((row) => mapFilmLogRow(row));
}
