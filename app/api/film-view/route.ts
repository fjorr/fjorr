import { NextResponse } from 'next/server';
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';
import { createClient as createCookieClient } from '@/lib/supabase/server';

function supabaseAnonKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Record a film view (Viewer # + Film Log when signed in).
 * Prefers Authorization: Bearer <access_token> from the browser session.
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

  const authHeader = request.headers.get('authorization') || '';
  const bearer = authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : '';

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = supabaseAnonKey();

  // Bearer path: JWT from the browser — auth.uid() is reliable.
  if (bearer) {
    const supabase = createSupabaseJsClient(url, key, {
      global: { headers: { Authorization: `Bearer ${bearer}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData } = await supabase.auth.getUser(bearer);
    const { data, error } = await supabase.rpc('record_film_view', {
      p_film_id: filmId,
    });

    if (error) {
      console.error('POST /api/film-view (bearer) failed:', error.message);
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
      signed_in: Boolean(userData.user),
    });
  }

  // Cookie fallback
  const supabase = await createCookieClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase.rpc('record_film_view', {
    p_film_id: filmId,
  });

  if (error) {
    console.error('POST /api/film-view (cookie) failed:', error.message);
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
