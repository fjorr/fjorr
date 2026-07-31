/**
 * Voyage lineage stats — who you passed a film to (direct + downstream).
 */

'use server';

import { createClient } from '@/lib/supabase/server';

export type VoyageLineageStats = {
  filmId: string;
  userId: string;
  directReferrals: number;
  downstreamTotal: number;
  depthFromRoot: number;
};

/** Own lineage stats for a film (authenticated). */
export async function getOwnVoyageLineageStats(
  filmId: string
): Promise<VoyageLineageStats | null> {
  const id = String(filmId || '').trim();
  if (!id) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.rpc('voyage_lineage_stats', {
    p_film_id: id,
    p_user_id: user.id,
  });

  if (error) {
    console.error('voyage_lineage_stats failed:', error.message);
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;

  return {
    filmId: id,
    userId: user.id,
    directReferrals: Number(row.direct_referrals) || 0,
    downstreamTotal: Number(row.downstream_total) || 0,
    depthFromRoot: Number(row.depth_from_root) || 0,
  };
}
