import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/lib/supabase/public';
import type { AppLocale } from '@/i18n/config';
import { defaultLocale } from '@/i18n/config';
import {
  fetchArtifactTranslations,
  mergeArtifactTranslation,
} from '@/lib/content/artifact-i18n';
import {
  fetchFilmTranslations,
  mergeFilmTranslation,
} from '@/lib/content/film-i18n';

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
  async (
    slug: string,
    locale: AppLocale = defaultLocale
  ): Promise<ArtifactMetadataRow | null> => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from('artifact')
      .select('id, name, teaser, slug, blok_ogrf')
      .eq('slug', slug)
      .maybeSingle();

    if (!data) return null;
    if (locale === defaultLocale) {
      const { id: _id, ...rest } = data;
      return rest;
    }

    const trMap = await fetchArtifactTranslations(supabase, [data.id], locale);
    const merged = mergeArtifactTranslation(data, trMap.get(data.id));
    return {
      name: merged.name,
      teaser: merged.teaser,
      slug: merged.slug,
      blok_ogrf: merged.blok_ogrf,
    };
  },
  ['artifact-metadata-i18n'],
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
  async (slug: string, locale: AppLocale = defaultLocale) => {
    const supabase = createPublicClient();

    const { data: artifact, error } = await supabase
      .from('artifact')
      .select(`
      id, name, slug, label, description, teaser, quote, primary_color, is_dark_bg, hero_clsx, hero_tall, blok_ogrf, link_cta, link, release_date,
      film!film_artifact ( id, name, slug, runtime )
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

    const rawCreatorObj = (mappingRows as { creator?: { name?: string } }[] | null)?.[0]
      ?.creator;
    const creatorName = rawCreatorObj?.name || '';

    let localizedArtifact: any = artifact;
    let relatedFilms: any[] = Array.isArray(artifact.film) ? artifact.film : [];

    if (locale !== defaultLocale) {
      const [trMap, filmTrMap] = await Promise.all([
        fetchArtifactTranslations(supabase, [artifact.id], locale),
        fetchFilmTranslations(
          supabase,
          relatedFilms.map((f: { id?: string }) => f.id).filter(Boolean) as string[],
          locale
        ),
      ]);

      localizedArtifact = mergeArtifactTranslation(artifact as any, trMap.get(artifact.id));
      relatedFilms = relatedFilms.map((film: any) =>
        film?.id ? mergeFilmTranslation(film, filmTrMap.get(film.id)) : film
      );
      localizedArtifact = { ...localizedArtifact, film: relatedFilms };
    }

    return { artifact: localizedArtifact, creatorName };
  },
  ['artifact-page-i18n'],
  { revalidate: ARTIFACT_REVALIDATE_SECONDS, tags: ['artifact'] }
);
