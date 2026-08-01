/**
 * Plus Machine — member film note mutations (server actions).
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { bureauxPlusNoteLimit, isOwnBureauxActive } from '@/lib/bureaux';

const MAX_BODY = 1000;
const MIN_BODY = 8;
/** Soft spam guard window for notes per film. */
const RATE_LIMIT_HOURS = 24;

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

  if (!(await isOwnBureauxActive(user.id))) {
    return { ok: false, error: 'bureauxRequired' };
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

  const maxNotes = bureauxPlusNoteLimit();

  const since = new Date(
    Date.now() - RATE_LIMIT_HOURS * 60 * 60 * 1000
  ).toISOString();
  const { count } = await supabase
    .from('film_notes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('film_id', filmId)
    .gte('created_at', since);

  if ((count || 0) >= maxNotes) {
    return { ok: false, error: 'rateLimited' };
  }

  const { data: film, error: filmError } = await supabase
    .from('film')
    .select('id, version, current_version_id')
    .eq('id', filmId)
    .maybeSingle();

  if (filmError || !film) {
    console.error('submitFilmNote film lookup failed:', filmError?.message);
    return { ok: false, error: 'submitError' };
  }

  const filmVersion = Math.max(1, Math.floor(Number(film.version) || 1));
  const filmVersionId = film.current_version_id
    ? String(film.current_version_id)
    : null;

  const { error } = await supabase.from('film_notes').insert({
    film_id: filmId,
    user_id: user.id,
    body,
    at_seconds: atSeconds,
    status: 'new',
    film_version: filmVersion,
    film_version_id: filmVersionId,
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
