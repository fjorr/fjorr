import type { AppLocale } from '@/i18n/config';
import { defaultLocale } from '@/i18n/config';
import type { SupabaseClient } from '@supabase/supabase-js';

export type FilmTranslationRow = {
  film_id: string;
  name: string | null;
  teaser: string | null;
  description: string | null;
  note: string | null;
  last_line: string | null;
  last_line_attribution: string | null;
  location: string | null;
  alt_text: string | null;
  title_art_code: string | null;
  blok_ogrf: string | null;
};

const FILM_TRANSLATION_SELECT =
  'film_id, name, teaser, description, note, last_line, last_line_attribution, location, alt_text, title_art_code, blok_ogrf';

function nonempty(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/** Overlay locale copy onto an English film row. Falls back field-by-field. */
export function mergeFilmTranslation<T extends Record<string, unknown>>(
  film: T,
  tr: FilmTranslationRow | null | undefined
): T {
  if (!tr) return film;

  const next: Record<string, unknown> = { ...film };
  const assign = (key: keyof FilmTranslationRow, targetKey: string = key) => {
    const value = nonempty(tr[key] as string | null);
    if (value != null) next[targetKey] = value;
  };

  assign('name');
  assign('teaser');
  assign('description');
  assign('note');
  assign('last_line');
  assign('last_line_attribution');
  assign('alt_text');
  assign('title_art_code');
  assign('blok_ogrf');

  const location = nonempty(tr.location);
  if (location != null) next.location = location;

  return next as T;
}

export async function fetchFilmTranslations(
  supabase: SupabaseClient,
  filmIds: string[],
  locale: AppLocale
): Promise<Map<string, FilmTranslationRow>> {
  const map = new Map<string, FilmTranslationRow>();
  if (locale === defaultLocale || filmIds.length === 0) return map;

  const unique = [...new Set(filmIds.filter(Boolean))];
  // Supabase `.in()` soft-limits; chunk if needed
  const chunkSize = 100;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from('film_translation')
      .select(FILM_TRANSLATION_SELECT)
      .eq('locale', locale)
      .in('film_id', chunk);

    if (error) {
      console.error('film_translation fetch failed:', error.message);
      continue;
    }
    for (const row of data || []) {
      map.set(row.film_id, row as FilmTranslationRow);
    }
  }
  return map;
}

export async function localizeFilms<T extends { id: string }>(
  supabase: SupabaseClient,
  films: T[],
  locale: AppLocale
): Promise<T[]> {
  if (locale === defaultLocale || films.length === 0) return films;
  const trMap = await fetchFilmTranslations(
    supabase,
    films.map((f) => f.id),
    locale
  );
  return films.map((film) =>
    mergeFilmTranslation(film as T & Record<string, unknown>, trMap.get(film.id))
  );
}

export async function fetchThemeNameMap(
  supabase: SupabaseClient,
  themeIds: string[],
  locale: AppLocale
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (locale === defaultLocale || themeIds.length === 0) return map;

  const { data, error } = await supabase
    .from('theme_translation')
    .select('theme_id, name')
    .eq('locale', locale)
    .in('theme_id', [...new Set(themeIds.filter(Boolean))]);

  if (error) {
    console.error('theme_translation fetch failed:', error.message);
    return map;
  }
  for (const row of data || []) {
    if (row.name) map.set(row.theme_id, row.name);
  }
  return map;
}

export async function fetchCreditRoleNameMap(
  supabase: SupabaseClient,
  locale: AppLocale
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (locale === defaultLocale) return map;

  const { data, error } = await supabase
    .from('credit_role_translation')
    .select('role_code, name')
    .eq('locale', locale);

  if (error) {
    console.error('credit_role_translation fetch failed:', error.message);
    return map;
  }
  for (const row of data || []) {
    if (row.role_code && row.name) map.set(row.role_code, row.name);
  }
  return map;
}

export async function fetchTagNameMap(
  supabase: SupabaseClient,
  tagIds: string[],
  locale: AppLocale
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (locale === defaultLocale || tagIds.length === 0) return map;

  const { data, error } = await supabase
    .from('tag_translation')
    .select('tag_id, name')
    .eq('locale', locale)
    .in('tag_id', [...new Set(tagIds.filter(Boolean))]);

  if (error) {
    console.error('tag_translation fetch failed:', error.message);
    return map;
  }
  for (const row of data || []) {
    if (row.tag_id && row.name) map.set(row.tag_id, row.name);
  }
  return map;
}

export async function fetchCollectionNameMap(
  supabase: SupabaseClient,
  collectionIds: string[],
  locale: AppLocale
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (locale === defaultLocale || collectionIds.length === 0) return map;

  const { data, error } = await supabase
    .from('collection_translation')
    .select('collection_id, name')
    .eq('locale', locale)
    .in('collection_id', [...new Set(collectionIds.filter(Boolean))]);

  if (error) {
    console.error('collection_translation fetch failed:', error.message);
    return map;
  }
  for (const row of data || []) {
    if (row.collection_id && row.name) map.set(row.collection_id, row.name);
  }
  return map;
}

/** Apply theme_translation onto rows that have theme: { id, name }. */
export function applyThemeNames<T extends Record<string, unknown>>(
  rows: T[],
  themeNames: Map<string, string>
): T[] {
  if (themeNames.size === 0) return rows;
  return rows.map((row) => {
    const theme = row.theme as { id?: string; name?: string } | null | undefined;
    if (!theme?.id) return row;
    const localized = themeNames.get(theme.id);
    if (!localized) return row;
    return { ...row, theme: { ...theme, name: localized } };
  });
}

/** Localize films and nested theme names when theme.id is present. */
export async function localizeFilmsWithThemes<T extends { id: string }>(
  supabase: SupabaseClient,
  films: T[],
  locale: AppLocale
): Promise<T[]> {
  const localized = await localizeFilms(supabase, films, locale);
  if (locale === defaultLocale) return localized;

  const themeIds = localized
    .map((row) => {
      const theme = (row as Record<string, unknown>).theme as
        | { id?: string }
        | null
        | undefined;
      return theme?.id;
    })
    .filter((id): id is string => Boolean(id));

  if (themeIds.length === 0) return localized;
  const themeNames = await fetchThemeNameMap(supabase, themeIds, locale);
  return applyThemeNames(localized as (T & Record<string, unknown>)[], themeNames) as T[];
}
