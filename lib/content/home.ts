import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/lib/supabase/public';
import type { HomeMix } from '@/lib/home-mix';
import type { AppLocale } from '@/i18n/config';
import { defaultLocale } from '@/i18n/config';
import { localizeFilms, localizeFilmsWithThemes, fetchCollectionCopyMap } from '@/lib/content/film-i18n';
import { localizeArtifacts } from '@/lib/content/artifact-i18n';

export type { HomeMix } from '@/lib/home-mix';

export const HOME_FILM_REVALIDATE_SECONDS = 60;
export const HOME_ARTIFACT_REVALIDATE_SECONDS = 300;

export const getFeaturedFilms = unstable_cache(
  async (locale: AppLocale = defaultLocale) => {
    const supabase = createPublicClient();

    // Single join: featured collection → mapped films (no UUID waterfall).
    const { data: mappedCollectionRows, error } = await supabase
      .from('collection_map')
      .select(`
      sort_order,
      collection!inner ( slug ),
      film (
        id,
        name,
        slug,
        mux_playback_id,
        teaser,
        story_date,
        hero_wide,
        hero_clsx,
        hero_tall,
        title_art_code,
        title_art_hex,
        title_art_scale,
        runtime,
        rating ( name ),
        theme ( id, name, slug ),
        creator:sponsor_id ( name )
      )
    `)
      .eq('collection.slug', 'featured')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Feature collection query failed:', error.message);
      return [];
    }

    const films = (mappedCollectionRows || [])
      .map((row: any) => {
        const f = row.film;
        if (!f) return null;

        const sponsorObj = f.creator || f.sponsor;

        return {
          ...f,
          sponsor:
            typeof sponsorObj === 'object' && sponsorObj !== null
              ? sponsorObj.name
              : sponsorObj,
        };
      })
      .filter(Boolean);

    return localizeFilmsWithThemes(supabase, films, locale);
  },
  ['home-featured-i18n-v2'],
  { revalidate: HOME_FILM_REVALIDATE_SECONDS, tags: ['film', 'home'] }
);

export const getCineHomeArtifacts = unstable_cache(
  async (locale: AppLocale = defaultLocale) => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('artifact')
      .select(
        `
        id, slug, name, blok_tall, teaser, created_at, label, release_date,
        creator_map ( creator ( name ) )
      `
      )
      .order('created_at', { ascending: false })
      .limit(36);

    if (error || !data) {
      console.error('Cine home artifacts failed:', error?.message);
      return [];
    }

    const mapped = data.map((row) => {
      const maps = Array.isArray(row.creator_map) ? row.creator_map : [];
      const creator =
        (maps[0] as { creator?: { name?: string } | null } | undefined)?.creator
          ?.name?.trim() || null;
      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        blok_tall: row.blok_tall,
        teaser: row.teaser,
        created_at: row.created_at,
        label: row.label ?? null,
        release_date: row.release_date ?? null,
        creator,
      };
    });

    return localizeArtifacts(supabase, mapped, locale);
  },
  ['home-cine-artifacts-i18n'],
  { revalidate: HOME_ARTIFACT_REVALIDATE_SECONDS, tags: ['artifact', 'home'] }
);

export const getFilmRailFilms = unstable_cache(
  async (mode: 'latest' | 'coming-soon', locale: AppLocale = defaultLocale) => {
    const supabase = createPublicClient();
    const currentIsoString = new Date().toISOString();

    let query = supabase.from('film').select('id, name, slug, blok_tall, release_date');

    if (mode === 'coming-soon') {
      query = query.gt('release_date', currentIsoString).order('release_date', { ascending: true });
    } else {
      query = query.lte('release_date', currentIsoString).order('release_date', { ascending: false });
    }

    const { data: rawFilms, error } = await query.limit(24);
    if (error || !rawFilms) {
      console.error(`Error loading rail [${mode}]:`, error);
      return [];
    }

    const mapped = rawFilms.map((film) => ({
      id: film.id,
      name: film.name,
      slug: String(film.slug || '').trim(),
      blok_tall: film.blok_tall,
      release_date: film.release_date,
    }));

    return localizeFilms(supabase, mapped, locale);
  },
  ['home-film-rail-i18n'],
  { revalidate: HOME_FILM_REVALIDATE_SECONDS, tags: ['film', 'home'] }
);

export const getArtifactRailItems = unstable_cache(
  async (locale: AppLocale = defaultLocale) => {
    const supabase = createPublicClient();
    const { data: artifacts, error } = await supabase
      .from('artifact')
      .select('id, slug, name, blok_tall')
      .order('created_at', { ascending: false })
      .limit(12);

    if (error || !artifacts) {
      console.error('Error loading artifact rail:', error);
      return [];
    }

    return localizeArtifacts(supabase, artifacts, locale);
  },
  ['home-artifact-rail-i18n'],
  { revalidate: HOME_ARTIFACT_REVALIDATE_SECONDS, tags: ['artifact', 'home'] }
);

export const getCineHomeFilms = unstable_cache(
  async (locale: AppLocale = defaultLocale) => {
    const supabase = createPublicClient();
    const currentIsoString = new Date().toISOString();
    // Posters-only grid — theme slug is the stable dial filter key.
    const select = `
      id,
      name,
      slug,
      release_date,
      blok_tall,
      theme ( id, name, slug )
    `;

    const [released, comingSoon] = await Promise.all([
      supabase
        .from('film')
        .select(select)
        .lte('release_date', currentIsoString)
        .order('release_date', { ascending: false })
        .limit(36),
      supabase
        .from('film')
        .select(select)
        .gt('release_date', currentIsoString)
        .order('release_date', { ascending: true })
        .limit(12),
    ]);

    if (released.error) console.error('Cine home released films failed:', released.error);
    if (comingSoon.error) console.error('Cine home coming soon films failed:', comingSoon.error);

    const rows = [...(released.data || []), ...(comingSoon.data || [])];
    return localizeFilmsWithThemes(supabase, rows as { id: string }[], locale);
  },
  ['home-cine-films-i18n-v2'],
  { revalidate: HOME_FILM_REVALIDATE_SECONDS, tags: ['film', 'home'] }
);

/** Curated mixes (collections) with film + artifact membership. */
export const getHomeMixes = unstable_cache(
  async (locale: AppLocale = defaultLocale): Promise<HomeMix[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('collection')
      .select(
        `
        id,
        slug,
        name,
        description,
        collection_map (
          sort_order,
          film ( id ),
          artifact ( id )
        )
      `
      )
      .order('name', { ascending: true });

    if (error || !data) {
      console.error('Home mixes query failed:', error?.message);
      return [];
    }

    const copyMap =
      locale === defaultLocale
        ? new Map<string, { name?: string; description?: string }>()
        : await fetchCollectionCopyMap(
            supabase,
            data.map((row: { id: string }) => row.id),
            locale
          );

    return data
      .map((row: any) => {
        const slug = String(row.slug || '').trim();
        const fallbackName = String(row.name || '').trim();
        const localized = copyMap.get(row.id);
        const name = localized?.name || fallbackName;
        if (!slug || !name) return null;

        const rawDescription = localized?.description ?? row.description;
        const description =
          typeof rawDescription === 'string' && rawDescription.trim()
            ? rawDescription.trim()
            : null;

        const maps = Array.isArray(row.collection_map) ? row.collection_map : [];
        const sorted = [...maps].sort(
          (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
        );
        const filmIds = sorted
          .map((m: any) => m?.film?.id)
          .filter((id: unknown): id is string => Boolean(id));
        const artifactIds = sorted
          .map((m: any) => m?.artifact?.id)
          .filter((id: unknown): id is string => Boolean(id));

        return {
          slug,
          name,
          description: description || null,
          filmIds,
          artifactIds,
        };
      })
      .filter(Boolean) as HomeMix[];
  },
  ['home-mixes-i18n'],
  {
    revalidate: HOME_FILM_REVALIDATE_SECONDS,
    tags: ['film', 'artifact', 'home'],
  }
);

const MINIMAL_FILM_SELECT = `
  id,
  name,
  slug,
  teaser,
  runtime,
  release_date,
  story_date,
  mux_playback_id,
  blok_tall,
  rating ( name ),
  theme ( id, name, slug )
`;

export const getMinimalHomeFilms = unstable_cache(
  async (locale: AppLocale = defaultLocale) => {
    const supabase = createPublicClient();
    const currentIsoString = new Date().toISOString();

    const [released, comingSoon] = await Promise.all([
      supabase
        .from('film')
        .select(MINIMAL_FILM_SELECT)
        .lte('release_date', currentIsoString)
        .order('release_date', { ascending: false })
        .limit(50),
      supabase
        .from('film')
        .select(MINIMAL_FILM_SELECT)
        .gt('release_date', currentIsoString)
        .order('release_date', { ascending: true })
        .limit(50),
    ]);

    if (released.error) console.error('Minimal home released films failed:', released.error);
    if (comingSoon.error) console.error('Minimal home coming soon films failed:', comingSoon.error);

    const rows = [...(released.data || []), ...(comingSoon.data || [])];
    return localizeFilmsWithThemes(supabase, rows as { id: string }[], locale);
  },
  ['home-minimal-i18n'],
  { revalidate: HOME_FILM_REVALIDATE_SECONDS, tags: ['film', 'home'] }
);
