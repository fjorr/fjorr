import { createClient } from '@/lib/supabase/server';

const EARLY_FILM_SELECT = `
  id,
  name,
  slug,
  mux_playback_id,
  teaser,
  story_date,
  location,
  hero_wide,
  hero_clsx,
  hero_tall,
  blok_tall,
  title_art_code,
  title_art_hex,
  title_art_scale,
  runtime,
  release_date,
  sponsor_id,
  rating ( name ),
  theme ( id, name, slug ),
  creator:sponsor_id ( name )
`;

const MERCEDES_SPONSOR_ID = '0afb5b63-1e90-4a37-824d-33cc41afde3d';

/** Feature-rail shaped early premiere — enough for hero + theater. */
export type EarlyReleaseFilm = {
  id: string;
  name: string;
  slug: string;
  mux_playback_id?: string | null;
  teaser?: string | null;
  story_date?: string | { name: string } | null;
  location?: string | string[] | { name?: string } | null;
  hero_wide?: string | null;
  hero_clsx?: string | null;
  hero_tall?: string | null;
  blok_tall?: string | null;
  title_art_code?: string | null;
  title_art_hex?: string | null;
  title_art_scale?: number | null;
  runtime?: number | null;
  release_date?: string | null;
  rating?: { name: string } | string | null;
  theme?: { id?: string; name: string; slug?: string } | string | null;
  sponsor?: string | { name: string } | null;
  sponsor_id?: string | null;
  last_line?: string | null;
  last_line_attribution?: string | null;
  has_subtitles?: boolean | null;
};

function resolveSponsorName(row: {
  creator?: { name?: string } | null;
  sponsor?: { name?: string } | string | null;
  sponsor_id?: string | null;
}) {
  const sponsorObj = row.creator || row.sponsor;
  const fromJoin =
    typeof sponsorObj === 'object' && sponsorObj !== null
      ? sponsorObj.name
      : typeof sponsorObj === 'string'
        ? sponsorObj
        : null;
  if (fromJoin) return fromJoin;
  if (row.sponsor_id === MERCEDES_SPONSOR_ID) return 'Mercedes-Benz';
  return null;
}

function mapEarlyFilmRow(row: Record<string, unknown> | null): EarlyReleaseFilm | null {
  if (!row?.id) return null;
  return {
    ...(row as EarlyReleaseFilm),
    id: String(row.id),
    name: String(row.name || 'Film'),
    slug: String(row.slug || ''),
    sponsor: resolveSponsorName(row as EarlyReleaseFilm),
  };
}

/**
 * Bureaux early premieres — films members can watch before public release.
 * Wired to `film.early_release` when that flag is set; otherwise empty.
 */
export async function getEarlyReleaseFilms(): Promise<EarlyReleaseFilm[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('film')
    .select(EARLY_FILM_SELECT)
    .eq('early_release', true)
    .order('release_date', { ascending: true })
    .limit(24);

  if (error) {
    // Column may not exist yet — treat as empty rather than break the page.
    if (!/early_release/i.test(error.message)) {
      console.error('getEarlyReleaseFilms failed:', error.message);
    }
    return [];
  }

  return (data || [])
    .map((row) => mapEarlyFilmRow(row as Record<string, unknown>))
    .filter((row): row is EarlyReleaseFilm => row != null);
}

/**
 * Temporary stand-ins with real hero assets — for layout testing until
 * early_release rows exist.
 */
export async function getTemporaryEarlyReleaseFilms(
  limit = 2
): Promise<EarlyReleaseFilm[]> {
  if (limit < 1) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('film')
    .select(EARLY_FILM_SELECT)
    .not('hero_wide', 'is', null)
    .order('release_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getTemporaryEarlyReleaseFilms failed:', error.message);
    return [];
  }

  return (data || [])
    .map((row) => mapEarlyFilmRow(row as Record<string, unknown>))
    .filter((row): row is EarlyReleaseFilm => row != null);
}
