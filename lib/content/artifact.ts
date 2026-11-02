import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/lib/supabase/public';
import type { AppLocale } from '@/i18n/config';
import { defaultLocale } from '@/i18n/config';
import {
  fetchArtifactTranslations,
  localizeArtifacts,
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

export type ArtifactSourceLink = {
  title: string;
  url: string | null;
};

/** Year from a real release date, or an editorial label such as "1600 BC". */
export function artifactDateLabel(artifact: {
  release_label?: string | null;
  release_date?: string | null;
}): string | null {
  const label =
    typeof artifact.release_label === 'string' ? artifact.release_label.trim() : '';
  if (label) return label;
  if (!artifact.release_date) return null;
  const year = new Date(artifact.release_date).getUTCFullYear();
  return Number.isFinite(year) ? String(year) : null;
}

export function normalizeArtifactSources(value: unknown): ArtifactSourceLink[] {
  if (!Array.isArray(value)) return [];
  const sources: ArtifactSourceLink[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const record = item as { title?: unknown; url?: unknown };
    const title = typeof record.title === 'string' ? record.title.trim() : '';
    if (!title) continue;
    const url = typeof record.url === 'string' ? record.url.trim() : '';
    sources.push({ title, url: url || null });
  }
  return sources;
}

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

export type MoreArtifact = {
  slug: string;
  name: string;
  image: string | null;
  meta: string | null;
};

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/** Every other artifact. Ones that share a film with `slug` come first. */
export const getMoreArtifacts = unstable_cache(
  async (slug: string, locale: AppLocale = defaultLocale): Promise<MoreArtifact[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('artifact')
      .select(
        'id, slug, name, label, release_label, release_date, hero_clsx, hero_tall, blok_tall, created_at, film_artifact ( film_id, sort_order )'
      )
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('More artifacts failed:', error?.message);
      return [];
    }

    type Row = (typeof data)[number] & {
      film_artifact?: { film_id?: string | null; sort_order?: number | null }[] | null;
    };
    const rows = data as Row[];
    const filmsOf = (row: Row) =>
      (Array.isArray(row.film_artifact) ? row.film_artifact : [])
        .map((link) => link?.film_id)
        .filter((id): id is string => Boolean(id));

    const current = rows.find((row) => row.slug === slug);
    const currentFilms = new Set(current ? filmsOf(current) : []);
    const others = rows.filter((row) => row.slug && row.slug !== slug);
    const sameFilm = others.filter((row) =>
      filmsOf(row).some((id) => currentFilms.has(id))
    );
    const sameFilmOrder = (row: Row) =>
      Math.min(
        ...(row.film_artifact || [])
          .filter((link) => link?.film_id && currentFilms.has(link.film_id))
          .map((link) => link?.sort_order ?? 0)
      );
    sameFilm.sort((a, b) => sameFilmOrder(a) - sameFilmOrder(b));
    const rest = others.filter((row) => !sameFilm.includes(row));

    const localized = await localizeArtifacts(
      supabase,
      [...sameFilm, ...rest].map((row) => ({ ...row, id: String(row.id) })),
      locale
    );

    return localized.map((row) => {
      const meta = [
        text(row.label),
        artifactDateLabel({
          release_label: text(row.release_label),
          release_date: text(row.release_date),
        }),
      ]
        .filter(Boolean)
        .join(' · ');
      return {
        slug: String(row.slug),
        name: text(row.name) || 'Artifact',
        image: text(row.blok_tall) || text(row.hero_tall) || text(row.hero_clsx),
        meta: meta || null,
      };
    });
  },
  ['more-artifacts-i18n-v2'],
  { revalidate: ARTIFACT_REVALIDATE_SECONDS, tags: ['artifact'] }
);

export const getArtifactPageData = unstable_cache(
  async (slug: string, locale: AppLocale = defaultLocale) => {
    const supabase = createPublicClient();

    const pageSelect = `
      id, name, slug, label, description, teaser, quote, quote_attribution, release_label, sources, primary_color, is_dark_bg, hero_clsx, hero_tall, blok_ogrf, link_cta, link, release_date,
      film!film_artifact ( id, name, slug, runtime, story_date, release_date, blok_wide, blok_tall, hero_wide, hero_clsx, hero_tall )
    `;
    // Keeps artifact pages up if the quote/sources migration is not applied yet.
    const legacySelect = `
      id, name, slug, label, description, teaser, quote, primary_color, is_dark_bg, hero_clsx, hero_tall, blok_ogrf, link_cta, link, release_date,
      film!film_artifact ( id, name, slug, runtime, story_date, release_date, blok_wide, blok_tall, hero_wide, hero_clsx, hero_tall )
    `;

    let { data: artifact, error } = await supabase
      .from('artifact')
      .select(pageSelect)
      .eq('slug', slug)
      .maybeSingle();

    if (error && /quote_attribution|release_label|sources|schema cache/i.test(error.message)) {
      const retry = await supabase
        .from('artifact')
        .select(legacySelect)
        .eq('slug', slug)
        .maybeSingle();
      // Legacy rows lack quote_attribution / release_label / sources; readers treat them as optional.
      artifact = retry.data as typeof artifact;
      error = retry.error;
    }

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
    // PostgREST may return a single related row as an object.
    const rawFilms = artifact.film;
    let relatedFilms: any[] = Array.isArray(rawFilms)
      ? rawFilms
      : rawFilms
        ? [rawFilms]
        : [];

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
    } else {
      localizedArtifact = { ...artifact, film: relatedFilms };
    }

    return { artifact: localizedArtifact, creatorName };
  },
  ['artifact-page-i18n-v10'],
  { revalidate: ARTIFACT_REVALIDATE_SECONDS, tags: ['artifact'] }
);
