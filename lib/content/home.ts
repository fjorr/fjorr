import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/lib/supabase/public';
import type { HomeMix } from '@/lib/home-mix';

export type { HomeMix } from '@/lib/home-mix';

export const HOME_FILM_REVALIDATE_SECONDS = 60;
export const HOME_ARTIFACT_REVALIDATE_SECONDS = 300;

export const getFeaturedFilms = unstable_cache(
  async () => {
    const supabase = createPublicClient();

    const { data: collectionRow, error: collectionError } = await supabase
      .from('collection')
      .select('id')
      .eq('slug', 'featured')
      .maybeSingle();

    if (collectionError || !collectionRow) {
      console.error('Could not locate the featured collection UUID reference.');
      return [];
    }

    const { data: mappedCollectionRows, error } = await supabase
      .from('collection_map')
      .select(`
      sort_order,
      film (
        id,
        name,
        slug,
        mux_playback_id,
        last_line,
        teaser,
        story_date,
        location,
        hero_wide,
        hero_clsx,
        hero_tall,
        title_art_code,
        title_art_hex,
        title_art_scale,
        runtime,
        rating ( name ),
        theme ( name ),
        creator:sponsor_id ( name )
      )
    `)
      .eq('collection_id', collectionRow.id)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Feature collection query failed:', error.message);
      return [];
    }

    return (mappedCollectionRows || [])
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
  },
  ['home-featured'],
  { revalidate: HOME_FILM_REVALIDATE_SECONDS, tags: ['film', 'home'] }
);

export const getCineHomeArtifacts = unstable_cache(
  async () => {
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
      .limit(80);

    if (error || !data) {
      console.error('Cine home artifacts failed:', error?.message);
      return [];
    }

    return data.map((row) => {
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
  },
  ['home-cine-artifacts-v2'],
  { revalidate: HOME_ARTIFACT_REVALIDATE_SECONDS, tags: ['artifact', 'home'] }
);

export const getFilmRailFilms = unstable_cache(
  async (mode: 'latest' | 'coming-soon') => {
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

    return rawFilms.map((film) => ({
      id: film.id,
      name: film.name,
      slug: String(film.slug || '').trim(),
      blok_tall: film.blok_tall,
      release_date: film.release_date,
    }));
  },
  ['home-film-rail'],
  { revalidate: HOME_FILM_REVALIDATE_SECONDS, tags: ['film', 'home'] }
);

export const getArtifactRailItems = unstable_cache(
  async () => {
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

    return artifacts;
  },
  ['home-artifact-rail'],
  { revalidate: HOME_ARTIFACT_REVALIDATE_SECONDS, tags: ['artifact', 'home'] }
);

export const getCineHomeFilms = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const currentIsoString = new Date().toISOString();
    const select = `
      id,
      name,
      slug,
      teaser,
      runtime,
      release_date,
      blok_tall,
      rating ( name ),
      theme ( name )
    `;

    const [released, comingSoon] = await Promise.all([
      supabase
        .from('film')
        .select(select)
        .lte('release_date', currentIsoString)
        .order('release_date', { ascending: false })
        .limit(80),
      supabase
        .from('film')
        .select(select)
        .gt('release_date', currentIsoString)
        .order('release_date', { ascending: true })
        .limit(40),
    ]);

    if (released.error) console.error('Cine home released films failed:', released.error);
    if (comingSoon.error) console.error('Cine home coming soon films failed:', comingSoon.error);

    return [...(released.data || []), ...(comingSoon.data || [])];
  },
  ['home-cine-films'],
  { revalidate: HOME_FILM_REVALIDATE_SECONDS, tags: ['film', 'home'] }
);

/** Curated mixes (collections) with film membership for the cine grid. */
export const getHomeMixes = unstable_cache(
  async (): Promise<HomeMix[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('collection')
      .select(
        `
        slug,
        name,
        collection_map (
          sort_order,
          film ( id )
        )
      `
      )
      .order('name', { ascending: true });

    if (error || !data) {
      console.error('Home mixes query failed:', error?.message);
      return [];
    }

    return data
      .map((row: any) => {
        const slug = String(row.slug || '').trim();
        const name = String(row.name || '').trim();
        if (!slug || !name) return null;

        const maps = Array.isArray(row.collection_map) ? row.collection_map : [];
        const sorted = [...maps].sort(
          (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
        );
        const filmIds = sorted
          .map((m: any) => m?.film?.id)
          .filter((id: unknown): id is string => Boolean(id));

        return { slug, name, filmIds };
      })
      .filter(Boolean) as HomeMix[];
  },
  ['home-mixes'],
  { revalidate: HOME_FILM_REVALIDATE_SECONDS, tags: ['film', 'home'] }
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
  rating ( name ),
  theme ( name )
`;

export const getMinimalHomeFilms = unstable_cache(
  async () => {
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

    return [...(released.data || []), ...(comingSoon.data || [])];
  },
  ['home-minimal'],
  { revalidate: HOME_FILM_REVALIDATE_SECONDS, tags: ['film', 'home'] }
);
