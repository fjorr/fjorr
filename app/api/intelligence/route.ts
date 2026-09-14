import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  collectSeeds,
  rankIntelligence,
  type IntelligencePortrait,
} from '@/lib/intelligence';

export const dynamic = 'force-dynamic';

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function loadPortraits(): Promise<IntelligencePortrait[]> {
  const supabase = serviceClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('film_filing')
    .select('notes, film:film_id(id, slug, name, teaser)')
    .neq('notes', '');

  if (error || !data?.length) return [];

  const out: IntelligencePortrait[] = [];
  for (const row of data) {
    const filmRaw = row.film as
      | { id: string; slug: string; name: string | null; teaser: string | null }
      | { id: string; slug: string; name: string | null; teaser: string | null }[]
      | null;
    const film = Array.isArray(filmRaw) ? filmRaw[0] : filmRaw;
    if (!film?.slug) continue;
    const notes = typeof row.notes === 'string' ? row.notes.trim() : '';
    if (!notes) continue;
    out.push({
      filmId: film.id,
      slug: film.slug,
      name: film.name || film.slug,
      teaser: film.teaser,
      notes,
    });
  }
  return out;
}

/**
 * GET /api/intelligence
 *   — idle: discovery seed prompts from Engine dumps
 * GET /api/intelligence?q=…
 *   — rank films that have Intelligence notes against the query
 *
 * Full notes never leave the server; only seeds + short "why" snippets.
 */
export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q')?.trim() || '';
    const portraits = await loadPortraits();
    const prompts = collectSeeds(portraits);

    if (!q) {
      return NextResponse.json({
        prompts,
        matches: [],
        count: portraits.length,
      });
    }

    const matches = rankIntelligence(portraits, q).map((m) => ({
      filmId: m.filmId,
      slug: m.slug,
      name: m.name,
      teaser: m.teaser,
      score: m.score,
      why: m.why,
    }));

    return NextResponse.json({
      prompts,
      matches,
      count: portraits.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'failed';
    return NextResponse.json({ error: msg, prompts: [], matches: [] }, { status: 500 });
  }
}
