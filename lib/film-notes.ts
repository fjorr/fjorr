/**
 * Plus Machine — read models (safe for server components; not a server-action file).
 */

import { createClient } from '@/lib/supabase/server';
import { filmNoteFrameUrl } from '@/lib/film-note-frame';
import type { FilmNoteRow, FilmNoteStatus } from '@/lib/film-note-types';

export type { FilmNoteRow, FilmNoteStatus };
export { filmNoteFrameUrl };

function mapNote(
  row: any,
  playbackByVersionId: Map<string, string>,
  playbackByFilmId: Map<string, string>
): FilmNoteRow {
  const film = Array.isArray(row.film) ? row.film[0] : row.film;
  const filmId = String(row.film_id);
  const versionId = row.film_version_id ? String(row.film_version_id) : null;
  const version = Number(row.film_version);

  const nestedFilmPlayback = film?.mux_playback_id
    ? String(film.mux_playback_id)
    : null;
  const mux_playback_id =
    (versionId ? playbackByVersionId.get(versionId) : null) ||
    nestedFilmPlayback ||
    playbackByFilmId.get(filmId) ||
    null;

  const at_seconds =
    row.at_seconds == null || Number.isNaN(Number(row.at_seconds))
      ? null
      : Math.floor(Number(row.at_seconds));

  return {
    id: String(row.id),
    created_at: String(row.created_at),
    film_id: filmId,
    film_name: film?.name ? String(film.name) : null,
    film_slug: film?.slug ? String(film.slug) : null,
    body: String(row.body || ''),
    at_seconds,
    status: (row.status || 'new') as FilmNoteStatus,
    film_version:
      Number.isFinite(version) && version >= 1 ? Math.floor(version) : 1,
    mux_playback_id,
    frame_url: filmNoteFrameUrl(mux_playback_id, at_seconds, 'sm'),
    frame_url_lg: filmNoteFrameUrl(mux_playback_id, at_seconds, 'lg'),
  };
}

/** Own notes, newest first. Pass userId to skip a second auth.getUser(). */
export async function getOwnFilmNotes(
  userId?: string
): Promise<FilmNoteRow[]> {
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
    .from('film_notes')
    .select(
      `
      id, created_at, film_id, body, at_seconds, status,
      film_version, film_version_id,
      film:film_id ( name, slug, mux_playback_id )
    `
    )
    .eq('user_id', uid)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('getOwnFilmNotes failed:', error.message);
    return [];
  }

  const rows = data || [];
  const versionIds = [
    ...new Set(
      rows
        .map((r: any) =>
          r.film_version_id ? String(r.film_version_id) : null
        )
        .filter((id): id is string => !!id)
    ),
  ];
  const filmIds = [
    ...new Set(rows.map((r: any) => String(r.film_id)).filter(Boolean)),
  ];

  const playbackByVersionId = new Map<string, string>();
  const playbackByFilmId = new Map<string, string>();

  const [versionsResult, filmsResult] = await Promise.all([
    versionIds.length > 0
      ? supabase
          .from('film_version')
          .select('id, mux_playback_id')
          .in('id', versionIds)
      : Promise.resolve({ data: null, error: null }),
    filmIds.length > 0
      ? supabase.from('film').select('id, mux_playback_id').in('id', filmIds)
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (versionsResult.error) {
    console.error(
      'getOwnFilmNotes versions failed:',
      versionsResult.error.message
    );
  } else {
    for (const v of versionsResult.data || []) {
      if (v.mux_playback_id) {
        playbackByVersionId.set(String(v.id), String(v.mux_playback_id));
      }
    }
  }

  if (filmsResult.error) {
    console.error('getOwnFilmNotes films failed:', filmsResult.error.message);
  } else {
    for (const f of filmsResult.data || []) {
      if (f.mux_playback_id) {
        playbackByFilmId.set(String(f.id), String(f.mux_playback_id));
      }
    }
  }

  return rows.map((row) =>
    mapNote(row, playbackByVersionId, playbackByFilmId)
  );
}
