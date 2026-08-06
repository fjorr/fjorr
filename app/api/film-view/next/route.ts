import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * Peek the next Voyageur No. for a film without awarding or incrementing.
 * Used for the guest "Ghost Voyageur" tease after Fin.
 */
export async function GET(request: Request) {
  const filmId = new URL(request.url).searchParams.get('filmId')?.trim();
  if (!filmId) {
    return NextResponse.json({ error: 'filmId required' }, { status: 400 });
  }

  try {
    const db = createServiceClient();
    const { data, error } = await db
      .from('film_view_counter')
      .select('next_viewer')
      .eq('film_id', filmId)
      .maybeSingle();

    if (error) {
      console.error('GET /api/film-view/next failed:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const next = Number(data?.next_viewer);
    return NextResponse.json({
      next_viewer: Number.isFinite(next) && next >= 1 ? next : 1,
    });
  } catch (err) {
    console.error('GET /api/film-view/next failed:', err);
    return NextResponse.json({ next_viewer: 1 });
  }
}
