/**
 * Plus Machine — member film notes (server).
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type FilmNoteStatus = 'new' | 'read' | 'archived';

export type FilmNoteRow = {
  id: string;
  created_at: string;
  film_id: string;
  film_name: string | null;
  film_slug: string | null;
  body: string;
  at_seconds: number | null;
  status: FilmNoteStatus;
};

const MAX_BODY = 1000;
const MIN_BODY = 8;
/** Soft spam guard — one note per film per member per day. */
const RATE_LIMIT_HOURS = 24;

function mapNote(row: any): FilmNoteRow {
  const film = Array.isArray(row.film) ? row.film[0] : row.film;
  return {
    id: String(row.id),
    created_at: String(row.created_at),
    film_id: String(row.film_id),
    film_name: film?.name ? String(film.name) : null,
    film_slug: film?.slug ? String(film.slug) : null,
    body: String(row.body || ''),
    at_seconds:
      row.at_seconds == null || Number.isNaN(Number(row.at_seconds))
        ? null
        : Math.floor(Number(row.at_seconds)),
    status: (row.status || 'new') as FilmNoteStatus,
  };
}

export async function submitFilmNote(input: {
  filmId: string;
  body: string;
  atSeconds?: number | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'signInRequired' };
  }

  const filmId = (input.filmId || '').trim();
  if (!filmId) return { ok: false, error: 'submitError' };

  const body = (input.body || '').trim();
  if (body.length < MIN_BODY) return { ok: false, error: 'bodyRequired' };
  if (body.length > MAX_BODY) return { ok: false, error: 'bodyTooLong' };

  let atSeconds: number | null = null;
  if (input.atSeconds != null && Number.isFinite(input.atSeconds)) {
    atSeconds = Math.max(0, Math.floor(input.atSeconds));
  }

  const since = new Date(
    Date.now() - RATE_LIMIT_HOURS * 60 * 60 * 1000
  ).toISOString();
  const { count } = await supabase
    .from('film_notes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('film_id', filmId)
    .gte('created_at', since);

  if ((count || 0) > 0) {
    return { ok: false, error: 'rateLimited' };
  }

  const { error } = await supabase.from('film_notes').insert({
    film_id: filmId,
    user_id: user.id,
    body,
    at_seconds: atSeconds,
    status: 'new',
  });

  if (error) {
    console.error('submitFilmNote failed:', error.message);
    return { ok: false, error: 'submitError' };
  }

  revalidatePath('/account/plus');
  revalidatePath('/admin/plus');
  revalidatePath('/admin');
  return { ok: true };
}

/** Own notes, newest first. */
export async function getOwnFilmNotes(): Promise<FilmNoteRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('film_notes')
    .select(
      `
      id, created_at, film_id, body, at_seconds, status,
      film:film_id ( name, slug )
    `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('getOwnFilmNotes failed:', error.message);
    return [];
  }

  return (data || []).map(mapNote);
}
