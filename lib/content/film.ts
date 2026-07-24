import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/lib/supabase/public';

/** Film pages: short window so release-date / CMS edits show up quickly. */
export const FILM_REVALIDATE_SECONDS = 60;

export type FilmMetadataRow = {
  name: string | null;
  teaser: string | null;
  slug: string;
  blok_ogrf: string | null;
};

export async function getFilmSlugs(): Promise<string[]> {
  const supabase = createPublicClient();
  const { data } = await supabase.from('film').select('slug');
  return (data || []).map((row) => row.slug).filter(Boolean);
}

export const getFilmMetadata = unstable_cache(
  async (slug: string): Promise<FilmMetadataRow | null> => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from('film')
      .select('name, teaser, slug, blok_ogrf')
      .eq('slug', slug)
      .maybeSingle();
    return data;
  },
  ['film-metadata'],
  { revalidate: FILM_REVALIDATE_SECONDS, tags: ['film'] }
);

export const getFilmPageData = unstable_cache(
  async (slug: string) => {
    const supabase = createPublicClient();
    const { data: filmData, error } = await supabase
      .from('film')
      .select(`*, rating ( name ), theme ( name )`)
      .eq('slug', slug)
      .maybeSingle();

    if (error || !filmData) {
      return null;
    }

    const showSubtitles = filmData.has_subtitles !== false;
    const currentIsoString = new Date().toISOString();

    const [junctionRows, allFilmsResponse, transcriptRows, tagsResponse, creatorsResponse] =
      await Promise.all([
        supabase
          .from('film_artifact')
          .select('sort_order, artifact:artifact_id (id, slug, name, blok_tall)')
          .eq('film_id', filmData.id)
          .order('sort_order', { ascending: true }),
        supabase
          .from('film')
          .select('id, name, slug, blok_tall, release_date')
          .lte('release_date', currentIsoString)
          .not('id', 'eq', filmData.id)
          .order('release_date', { ascending: false })
          .limit(12),
        showSubtitles
          ? supabase.from('transcript').select('content, language_code').eq('film_id', filmData.id)
          : Promise.resolve({ data: [] as { content: string; language_code: string }[] }),
        supabase.from('tag_map').select('tag:tag_id ( name )').eq('film_id', filmData.id),
        supabase
          .from('creator_map')
          .select('role, creator:creator_id ( name )')
          .eq('film_id', filmData.id)
          .order('sort_order', { ascending: true }),
      ]);

    return {
      filmData,
      relatedArtifacts: junctionRows.data || [],
      recommendedFilms: allFilmsResponse.data || [],
      transcripts: showSubtitles ? transcriptRows.data || [] : [],
      tagRows: tagsResponse.data || [],
      creatorRows: creatorsResponse.data || [],
    };
  },
  ['film-page'],
  { revalidate: FILM_REVALIDATE_SECONDS, tags: ['film'] }
);
