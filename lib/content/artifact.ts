import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/lib/supabase/public';

/** Artifacts change less often than films. */
export const ARTIFACT_REVALIDATE_SECONDS = 300;

export type ArtifactMetadataRow = {
  name: string | null;
  teaser: string | null;
  slug: string;
  blok_ogrf: string | null;
};

export type ArtifactColorTokens = {
  primary_color: string | null;
  is_dark_bg: boolean | null;
};

export async function getArtifactSlugs(): Promise<string[]> {
  const supabase = createPublicClient();
  const { data } = await supabase.from('artifact').select('slug');
  return (data || []).map((row) => row.slug).filter(Boolean);
}

export const getArtifactMetadata = unstable_cache(
  async (slug: string): Promise<ArtifactMetadataRow | null> => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from('artifact')
      .select('name, teaser, slug, blok_ogrf')
      .eq('slug', slug)
      .maybeSingle();
    return data;
  },
  ['artifact-metadata'],
  { revalidate: ARTIFACT_REVALIDATE_SECONDS, tags: ['artifact'] }
);

export const getArtifactColorTokens = unstable_cache(
  async (slug: string): Promise<ArtifactColorTokens | null> => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from('artifact')
      .select('primary_color, is_dark_bg')
      .eq('slug', slug)
      .maybeSingle();
    return data;
  },
  ['artifact-colors'],
  { revalidate: ARTIFACT_REVALIDATE_SECONDS, tags: ['artifact'] }
);

export const getArtifactPageData = unstable_cache(
  async (slug: string) => {
    const supabase = createPublicClient();

    const { data: artifact, error } = await supabase
      .from('artifact')
      .select(`
      id, name, slug, label, description, teaser, quote, primary_color, is_dark_bg, hero_clsx, hero_tall, blok_ogrf, link_cta, link, release_date,
      film!film_artifact ( name, slug, runtime )
    `)
      .eq('slug', slug)
      .maybeSingle();

    if (error || !artifact) {
      return null;
    }

    const { data: mappingRows } = await supabase
      .from('creator_map')
      .select(`creator ( name )`)
      .eq('artifact_id', artifact.id);

    const rawCreatorObj = (mappingRows as { creator?: { name?: string } }[] | null)?.[0]?.creator;
    const creatorName = rawCreatorObj?.name || '';

    return { artifact, creatorName };
  },
  ['artifact-page'],
  { revalidate: ARTIFACT_REVALIDATE_SECONDS, tags: ['artifact'] }
);
