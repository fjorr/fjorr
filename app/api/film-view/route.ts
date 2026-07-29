import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Record a film view (Viewer # + Film Log when signed in).
 * Uses cookie session on the server — more reliable than browser RPC auth.
 */
export async function POST(request: Request) {
  let filmId = '';
  try {
    const body = (await request.json()) as { filmId?: string };
    filmId = String(body?.filmId || '').trim();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  if (!filmId) {
    return NextResponse.json({ error: 'filmId required' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase.rpc('record_film_view', {
    p_film_id: filmId,
  });

  if (error) {
    console.error('POST /api/film-view failed:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return NextResponse.json({ error: 'No result' }, { status: 500 });
  }

  return NextResponse.json({
    viewer_number: Number(row.viewer_number),
    recorded: Boolean(row.recorded),
    user_id: row.user_id ? String(row.user_id) : null,
    signed_in: Boolean(user),
  });
}
