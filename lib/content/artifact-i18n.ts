import type { AppLocale } from '@/i18n/config';
import { defaultLocale } from '@/i18n/config';
import type { SupabaseClient } from '@supabase/supabase-js';

export type ArtifactTranslationRow = {
  artifact_id: string;
  name: string | null;
  teaser: string | null;
  description: string | null;
  label: string | null;
  quote: string | null;
  link_cta: string | null;
};

const ARTIFACT_TRANSLATION_SELECT =
  'artifact_id, name, teaser, description, label, quote, link_cta';

function nonempty(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/** Overlay locale copy onto an English artifact row. Falls back field-by-field. */
export function mergeArtifactTranslation<T extends Record<string, unknown>>(
  artifact: T,
  tr: ArtifactTranslationRow | null | undefined
): T {
  if (!tr) return artifact;

  const next: Record<string, unknown> = { ...artifact };
  const assign = (key: keyof ArtifactTranslationRow) => {
    const value = nonempty(tr[key] as string | null);
    if (value != null) next[key] = value;
  };

  assign('name');
  assign('teaser');
  assign('description');
  assign('label');
  assign('quote');
  assign('link_cta');

  return next as T;
}

export async function fetchArtifactTranslations(
  supabase: SupabaseClient,
  artifactIds: string[],
  locale: AppLocale
): Promise<Map<string, ArtifactTranslationRow>> {
  const map = new Map<string, ArtifactTranslationRow>();
  if (locale === defaultLocale || artifactIds.length === 0) return map;

  const unique = [...new Set(artifactIds.filter(Boolean))];
  const chunkSize = 100;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from('artifact_translation')
      .select(ARTIFACT_TRANSLATION_SELECT)
      .eq('locale', locale)
      .in('artifact_id', chunk);

    if (error) {
      console.error('artifact_translation fetch failed:', error.message);
      continue;
    }
    for (const row of data || []) {
      map.set(row.artifact_id, row as ArtifactTranslationRow);
    }
  }
  return map;
}

export async function localizeArtifacts<T extends { id: string }>(
  supabase: SupabaseClient,
  artifacts: T[],
  locale: AppLocale
): Promise<T[]> {
  if (locale === defaultLocale || artifacts.length === 0) return artifacts;
  const trMap = await fetchArtifactTranslations(
    supabase,
    artifacts.map((a) => a.id),
    locale
  );
  return artifacts.map((artifact) =>
    mergeArtifactTranslation(
      artifact as T & Record<string, unknown>,
      trMap.get(artifact.id)
    )
  );
}
