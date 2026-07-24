import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/lib/supabase/public';

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
