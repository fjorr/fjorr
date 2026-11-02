import type { ExhibitionFilm } from '@/components/house/ExhibitionSheet';
import { artifactDateLabel } from '@/lib/content/artifact';

type CreditRow = {
  creator?: { name?: unknown; slug?: unknown; image?: unknown } | null;
  role?: unknown;
};

type ArtifactRow = {
  artifact?: {
    slug?: unknown;
    name?: unknown;
    label?: unknown;
    release_label?: unknown;
    release_date?: unknown;
    hero_clsx?: unknown;
    hero_tall?: unknown;
    blok_tall?: unknown;
  } | null;
};

function textOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/**
 * The reading under a film poster. Same shape the info sheet used.
 * Moonshot keeps a stand-in director's note until the CMS field is filled.
 */
export function buildExhibitionFilm(input: {
  filmData: {
    name?: string | null;
    slug?: string | null;
    teaser?: string | null;
    description?: string | null;
    director_note?: string | null;
    story_date?: unknown;
    rating?: unknown;
    runtime?: number | null;
    theme?: unknown;
    location?: unknown;
    release_date?: string | null;
  };
  creatorRows?: CreditRow[] | null;
  relatedArtifacts?: ArtifactRow[] | null;
  processImages?: ExhibitionFilm['processImages'];
  transcripts?: ExhibitionFilm['transcripts'];
  subtitleTracks?: ExhibitionFilm['tracks'];
}): ExhibitionFilm {
  const filmData = input.filmData;
  const asText = (value: unknown): string | null => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value && 'name' in value) {
      const name = (value as { name?: unknown }).name;
      return typeof name === 'string' ? name : null;
    }
    return null;
  };
  const formatLocation = (raw: unknown): string | null => {
    if (!raw) return null;
    if (typeof raw === 'string') return raw.trim() || null;
    if (Array.isArray(raw)) {
      const parts = raw.map((v) => String(v).trim()).filter(Boolean);
      return parts.length ? parts.join(', ') : null;
    }
    return null;
  };

  const slug = String(filmData.slug || '');
  const credits = (input.creatorRows || [])
    .map((row) => ({
      name: row?.creator?.name ? String(row.creator.name) : '',
      role: row?.role ? String(row.role) : '',
      slug: row?.creator?.slug ? String(row.creator.slug) : null,
      image: row?.creator?.image ? String(row.creator.image) : null,
    }))
    .filter((row) => row.name);

  const artifacts = (input.relatedArtifacts || [])
    .map((row) => row?.artifact)
    .filter(Boolean)
    .map((artifact) => {
      const label = textOrNull(artifact?.label);
      const date = artifactDateLabel({
        release_label: textOrNull(artifact?.release_label),
        release_date: textOrNull(artifact?.release_date),
      });
      const meta = [label, date].filter(Boolean).join(' · ');
      return {
        slug: String(artifact?.slug || ''),
        name: artifact?.name ? String(artifact.name) : 'Artifact',
        image:
          textOrNull(artifact?.blok_tall) ||
          textOrNull(artifact?.hero_tall) ||
          textOrNull(artifact?.hero_clsx),
        meta: meta || null,
      };
    })
    .filter((artifact) => artifact.slug);

  const directorNote =
    filmData.director_note ||
    (slug === 'moonshot'
      ? 'Kennedy did not ask for a speech about the moon. He asked for a reason America should try. The film is that reason, cut short — a dare aimed at the horizon, still unfinished in the best way.'
      : null);

  return {
    name: filmData.name || 'Untitled',
    teaser: filmData.teaser || null,
    description: filmData.description || null,
    directorNote,
    storyDate:
      asText(filmData.story_date) ||
      (typeof filmData.story_date === 'string' ? filmData.story_date : null),
    rating: asText(filmData.rating),
    runtime: filmData.runtime ?? null,
    theme: asText(filmData.theme),
    location: formatLocation(filmData.location),
    releaseDate: filmData.release_date || null,
    audioLanguages: ['English'],
    credits,
    artifacts,
    processImages: input.processImages || [],
    transcripts: input.transcripts || [],
    tracks: input.subtitleTracks || [],
  };
}
