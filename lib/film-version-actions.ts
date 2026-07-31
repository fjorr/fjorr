/**
 * Film version reads + Plus ship (admin).
 */

'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-auth';
import { createPublicClient } from '@/lib/supabase/public';
import { createServiceClient } from '@/lib/supabase/service';
import type { FilmVersion } from '@/lib/film-version';

function mapVersion(row: any): FilmVersion {
  return {
    id: String(row.id),
    film_id: String(row.film_id),
    version: Number(row.version),
    mux_playback_id: row.mux_playback_id ? String(row.mux_playback_id) : null,
    runtime: row.runtime != null ? Number(row.runtime) : null,
    changelog: row.changelog ? String(row.changelog) : null,
    status: row.status === 'live' ? 'live' : 'archived',
    shipped_at: String(row.shipped_at),
    shipped_by: row.shipped_by ? String(row.shipped_by) : null,
    source_note_id: row.source_note_id ? String(row.source_note_id) : null,
  };
}

/** Changelog for a film — newest first. */
export async function listFilmVersions(
  filmId: string
): Promise<FilmVersion[]> {
  if (!filmId) return [];
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('film_version')
    .select(
      'id, film_id, version, mux_playback_id, runtime, changelog, status, shipped_at, shipped_by, source_note_id'
    )
    .eq('film_id', filmId)
    .order('version', { ascending: false });

  if (error) {
    console.error('listFilmVersions failed:', error.message);
    return [];
  }
  return (data || []).map(mapVersion);
}

export type ShipFilmVersionInput = {
  filmId: string;
  muxPlaybackId: string;
  changelog?: string;
  runtime?: number | null;
  sourceNoteId?: string | null;
};

export type ShipFilmVersionResult =
  | { ok: true; version: FilmVersion }
  | { ok: false; error: string };

/** Archive live cut, ship next version, sync film.mux_playback_id. */
export async function shipFilmVersion(
  input: ShipFilmVersionInput
): Promise<ShipFilmVersionResult> {
  const admin = await requireAdmin();
  const filmId = String(input.filmId || '').trim();
  const muxPlaybackId = String(input.muxPlaybackId || '').trim();
  if (!filmId) return { ok: false, error: 'filmId required' };
  if (!muxPlaybackId) return { ok: false, error: 'muxPlaybackId required' };

  const db = createServiceClient();
  const { data, error } = await db.rpc('ship_film_version', {
    p_film_id: filmId,
    p_mux_playback_id: muxPlaybackId,
    p_changelog: input.changelog?.trim() || null,
    p_runtime: input.runtime ?? null,
    p_source_note_id: input.sourceNoteId || null,
    p_shipped_by: admin.user.id,
  });

  if (error) {
    console.error('shipFilmVersion failed:', error.message);
    return { ok: false, error: error.message };
  }

  const cut = Array.isArray(data) ? data[0] : data;
  if (!cut) return { ok: false, error: 'No version returned' };

  const version = mapVersion(cut);
  revalidatePath('/admin');
  revalidatePath('/admin/plus');
  revalidatePath('/');
  return { ok: true, version };
}
