import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/lib/supabase/public';
import type { AppLocale } from '@/i18n/config';
import { defaultLocale } from '@/i18n/config';
import {
  fetchCreditRoleNameMap,
  fetchFilmTranslations,
  fetchTagNameMap,
  fetchThemeNameMap,
  mergeFilmTranslation,
} from '@/lib/content/film-i18n';
import {
  fetchArtifactTranslations,
  mergeArtifactTranslation,
} from '@/lib/content/artifact-i18n';

/** Film pages: short window so release-date / CMS edits show up quickly. */
export const FILM_REVALIDATE_SECONDS = 60;

export type FilmMetadataRow = {
  name: string | null;
  teaser: string | null;
  slug: string;
  blok_ogrf: string | null;
};

const FILM_PAGE_SELECT = `
  id,
  name,
  slug,
  teaser,
  description,
  note,
  mux_playback_id,
  last_line,
  last_line_attribution,
  alt_text,
  story_date,
  location,
  hero_wide,
  hero_clsx,
  hero_tall,
  title_art_code,
  title_art_hex,
  title_art_scale,
  blok_tall,
  blok_ogrf,
  runtime,
  release_date,
  has_subtitles,
  sponsor_id,
  rating ( name ),
  theme ( id, name, slug )
`;

export async function getFilmSlugs(): Promise<string[]> {
  const supabase = createPublicClient();
  const { data } = await supabase.from('film').select('slug');
  return (data || []).map((row) => row.slug).filter(Boolean);
}

export const getFilmMetadata = unstable_cache(
  async (slug: string, locale: AppLocale = defaultLocale): Promise<FilmMetadataRow | null> => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from('film')
      .select('id, name, teaser, slug, blok_ogrf')
      .eq('slug', slug)
      .maybeSingle();

    if (!data) return null;
    if (locale === defaultLocale) {
      const { id: _id, ...rest } = data;
      return rest;
    }

    const trMap = await fetchFilmTranslations(supabase, [data.id], locale);
    const merged = mergeFilmTranslation(data, trMap.get(data.id));
    return {
      name: merged.name,
      teaser: merged.teaser,
      slug: merged.slug,
      blok_ogrf: merged.blok_ogrf,
    };
  },
  ['film-metadata-i18n'],
  { revalidate: FILM_REVALIDATE_SECONDS, tags: ['film'] }
);

export const getFilmPageData = unstable_cache(
  async (slug: string, locale: AppLocale = defaultLocale) => {
    const supabase = createPublicClient();
    const { data: filmData, error } = await supabase
      .from('film')
      .select(FILM_PAGE_SELECT)
      .eq('slug', slug)
      .maybeSingle();

    if (error || !filmData) {
      return null;
    }

    const showSubtitles = filmData.has_subtitles !== false;
    const currentIsoString = new Date().toISOString();

    const [junctionRows, allFilmsResponse, subtitleRows, tagsResponse, creatorsResponse] =
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
          ? supabase
              .from('language_subtitle')
              .select(
                `
                vtt_url,
                language (
                  code,
                  name
                )
              `
              )
              .eq('film_id', filmData.id)
          : Promise.resolve({ data: [] as any[] }),
        supabase.from('tag_map').select('tag:tag_id ( id, name )').eq('film_id', filmData.id),
        supabase
          .from('creator_map')
          .select('role, role_code, creator:creator_id ( name )')
          .eq('film_id', filmData.id)
          .order('sort_order', { ascending: true }),
      ]);

    let localizedFilm: any = filmData;
    let recommended: any[] = allFilmsResponse.data || [];
    let creatorRows: any[] = creatorsResponse.data || [];
    let relatedArtifacts: any[] = junctionRows.data || [];
    let tagRows: any[] = tagsResponse.data || [];

    if (locale !== defaultLocale) {
      const themeId =
        typeof filmData.theme === 'object' && filmData.theme
          ? (filmData.theme as { id?: string }).id
          : null;

      const relatedArtifactIds = relatedArtifacts
        .map((row: any) => row?.artifact?.id)
        .filter(Boolean) as string[];

      const [trMap, themeNames, roleNames, tagNames, recommendedLocalized, artifactTrMap] =
        await Promise.all([
          fetchFilmTranslations(supabase, [filmData.id], locale),
          themeId
            ? fetchThemeNameMap(supabase, [themeId], locale)
            : Promise.resolve(new Map<string, string>()),
          fetchCreditRoleNameMap(supabase, locale),
          fetchTagNameMap(
            supabase,
            tagRows.map((row: any) => row?.tag?.id).filter(Boolean) as string[],
            locale
          ),
          (async () => {
            const rows = allFilmsResponse.data || [];
            const map = await fetchFilmTranslations(
              supabase,
              rows.map((r: { id: string }) => r.id),
              locale
            );
            return rows.map((row: any) => mergeFilmTranslation(row, map.get(row.id)));
          })(),
          fetchArtifactTranslations(supabase, relatedArtifactIds, locale),
        ]);

      localizedFilm = mergeFilmTranslation(filmData as any, trMap.get(filmData.id));
      if (themeId && themeNames.has(themeId) && localizedFilm.theme) {
        localizedFilm = {
          ...localizedFilm,
          theme: {
            ...localizedFilm.theme,
            name: themeNames.get(themeId),
          },
        };
      }

      recommended = recommendedLocalized;

      relatedArtifacts = relatedArtifacts.map((row: any) => {
        const art = row?.artifact;
        if (!art?.id) return row;
        return {
          ...row,
          artifact: mergeArtifactTranslation(art, artifactTrMap.get(art.id)),
        };
      });

      if (roleNames.size > 0) {
        creatorRows = creatorRows.map((row: any) => {
          const code = row.role_code as string | null;
          if (code && roleNames.has(code)) {
            return { ...row, role: roleNames.get(code) };
          }
          return row;
        });
      }

      if (tagNames.size > 0) {
        tagRows = tagRows.map((row: any) => {
          const tag = row?.tag;
          if (!tag?.id || !tagNames.has(tag.id)) return row;
          return { ...row, tag: { ...tag, name: tagNames.get(tag.id) } };
        });
      }
    }

    const subtitleTracks = (subtitleRows.data || []).map((track: any) => ({
      code: track.language?.code || 'en',
      name: track.language?.name || 'English',
      vtt_url: track.vtt_url || '',
    }));

    return {
      filmData: localizedFilm,
      relatedArtifacts,
      recommendedFilms: recommended,
      subtitleTracks,
      tagRows,
      creatorRows,
    };
  },
  ['film-page-i18n'],
  { revalidate: FILM_REVALIDATE_SECONDS, tags: ['film'] }
);

/** Heavy VTT / transcript bodies — load below the fold separately. */
export const getFilmTranscripts = unstable_cache(
  async (filmId: string) => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from('transcript')
      .select('content, language_code')
      .eq('film_id', filmId);
    return data || [];
  },
  ['film-transcripts'],
  { revalidate: FILM_REVALIDATE_SECONDS, tags: ['film'] }
);
