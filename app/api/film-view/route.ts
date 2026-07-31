import { NextResponse } from 'next/server';
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';
import { createClient as createCookieClient } from '@/lib/supabase/server';
import { parseViaMemberNumber } from '@/lib/voyage-via';

function supabaseAnonKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

type FilmViewBody = {
  filmId?: string;
  viaMemberNumber?: number | string | null;
};

/** Member # for share/via — null when opted out of the voyage trail. */
async function shareViaMemberNumberForUser(
  supabase: {
    from: (t: string) => {
      select: (cols: string) => {
        eq: (
          col: string,
          val: string
        ) => {
          maybeSingle: () => Promise<{
            data: {
              member_number?: number;
              voyage_lineage_enabled?: boolean | null;
            } | null;
          }>;
        };
      };
    };
  },
  userId: string
): Promise<number | null> {
  const { data } = await supabase
    .from('profiles')
    .select('member_number, voyage_lineage_enabled')
    .eq('id', userId)
    .maybeSingle();
  if (data?.voyage_lineage_enabled === false) return null;
  const n = Number(data?.member_number);
  return Number.isFinite(n) && n >= 1 ? n : null;
}

function mapResult(
  row: Record<string, unknown>,
  signedIn: boolean,
  memberNumber: number | null
) {
  const filmVersion = Number(row.film_version);
  const referred = row.referred_by_user_id
    ? String(row.referred_by_user_id)
    : null;
  return {
    viewer_number: Number(row.viewer_number),
    recorded: Boolean(row.recorded),
    user_id: row.user_id ? String(row.user_id) : null,
    film_version:
      Number.isFinite(filmVersion) && filmVersion >= 1 ? filmVersion : 1,
    film_version_id: row.film_version_id
      ? String(row.film_version_id)
      : null,
    referred_by_user_id: referred,
    member_number: memberNumber,
    signed_in: signedIn,
  };
}

/**
 * Record a film view (Viewer # + Voyage when signed in).
 * Prefers Authorization: Bearer <access_token> from the browser session.
 * Optional viaMemberNumber stamps lineage on first log only.
 */
export async function POST(request: Request) {
  let filmId = '';
  let viaMemberNumber: number | null = null;
  try {
    const body = (await request.json()) as FilmViewBody;
    filmId = String(body?.filmId || '').trim();
    viaMemberNumber = parseViaMemberNumber(
      body?.viaMemberNumber != null ? String(body.viaMemberNumber) : null
    );
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  if (!filmId) {
    return NextResponse.json({ error: 'filmId required' }, { status: 400 });
  }

  const rpcArgs: { p_film_id: string; p_referred_by_member_number?: number } = {
    p_film_id: filmId,
  };
  if (viaMemberNumber != null) {
    rpcArgs.p_referred_by_member_number = viaMemberNumber;
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
    const { data, error } = await supabase.rpc('record_film_view', rpcArgs);

    if (error) {
      console.error('POST /api/film-view (bearer) failed:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      return NextResponse.json({ error: 'No result' }, { status: 500 });
    }

    const memberNumber = userData.user
      ? await shareViaMemberNumberForUser(supabase as any, userData.user.id)
      : null;

    return NextResponse.json(
      mapResult(row as Record<string, unknown>, Boolean(userData.user), memberNumber)
    );
  }

  // Cookie fallback
  const supabase = await createCookieClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase.rpc('record_film_view', rpcArgs);

  if (error) {
    console.error('POST /api/film-view (cookie) failed:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return NextResponse.json({ error: 'No result' }, { status: 500 });
  }

  const memberNumber = user
    ? await shareViaMemberNumberForUser(supabase as any, user.id)
    : null;

  return NextResponse.json(
    mapResult(row as Record<string, unknown>, Boolean(user), memberNumber)
  );
}
