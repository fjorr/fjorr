import { NextResponse } from 'next/server';
import { parseLocale } from '@/i18n/config';
import { buildExhibitionFilm } from '@/lib/content/exhibition-film';
import { getFilmPageData } from '@/lib/content/film';

/** Exhibition copy for a film the poster rail swiped to. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = (url.searchParams.get('slug') || '').trim();
  if (!/^[a-z0-9-]+$/i.test(slug)) {
    return NextResponse.json({ error: 'Unknown film' }, { status: 400 });
  }

  const locale = parseLocale(url.searchParams.get('locale'));
  const page = await getFilmPageData(slug, locale);
  if (!page) {
    return NextResponse.json({ error: 'Unknown film' }, { status: 404 });
  }

  return NextResponse.json(
    buildExhibitionFilm({
      filmData: page.filmData,
      creatorRows: page.creatorRows,
      relatedArtifacts: page.relatedArtifacts,
      processImages: page.processImages,
      transcripts: [],
      subtitleTracks: page.subtitleTracks,
    })
  );
}
