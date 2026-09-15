import { absoluteUrl } from '@/lib/site';
import { socialOgImageUrl } from '@/lib/og';

/** Runtime in the CMS is seconds. */
export function iso8601Duration(runtimeSeconds?: number | null): string | null {
  if (runtimeSeconds == null || !Number.isFinite(runtimeSeconds) || runtimeSeconds <= 0) {
    return null;
  }
  const total = Math.round(runtimeSeconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `PT${h}H${m}M${s}S`;
  if (m > 0) return `PT${m}M${s}S`;
  return `PT${s}S`;
}

export function muxThumbnailUrl(playbackId?: string | null): string | null {
  const id = playbackId?.trim();
  if (!id) return null;
  return `https://image.mux.com/${id}/thumbnail.jpg?time=1&width=1280`;
}

export function muxStreamUrl(playbackId?: string | null): string | null {
  const id = playbackId?.trim();
  if (!id) return null;
  return `https://stream.mux.com/${id}.m3u8`;
}

export type FilmVideoCredit = {
  name: string;
  role?: string | null;
};

export type FilmVideoObjectInput = {
  name: string;
  description?: string | null;
  slug: string;
  thumbnailUrl: string;
  uploadDate?: string | null;
  runtimeSeconds?: number | null;
  muxPlaybackId?: string | null;
  credits?: FilmVideoCredit[];
};

function pickDirector(credits: FilmVideoCredit[] | undefined): string | null {
  if (!credits?.length) return null;
  const hit = credits.find((c) => /director/i.test(c.role || ''));
  return hit?.name?.trim() || null;
}

/** schema.org VideoObject for a film watch page. */
export function buildFilmVideoObject(input: FilmVideoObjectInput) {
  const watchUrl = absoluteUrl(`/film/${input.slug}`);
  const duration = iso8601Duration(input.runtimeSeconds);
  const embedUrl = absoluteUrl(`/embed/film/${input.slug}`);
  const contentUrl = muxStreamUrl(input.muxPlaybackId);
  const directorName = pickDirector(input.credits);

  const json: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: input.name,
    description:
      input.description?.trim() ||
      `Watch ${input.name} — a short film on Fjorr.`,
    thumbnailUrl: input.thumbnailUrl,
    url: watchUrl,
    embedUrl,
    publisher: {
      '@type': 'Organization',
      name: 'Fjorr',
      url: absoluteUrl('/'),
    },
  };

  if (input.uploadDate) json.uploadDate = input.uploadDate;
  if (duration) json.duration = duration;
  if (contentUrl) json.contentUrl = contentUrl;
  if (directorName) {
    json.author = { '@type': 'Person', name: directorName };
    json.director = { '@type': 'Person', name: directorName };
  }

  return json;
}

export function filmVideoSitemapFields(input: {
  name: string;
  description?: string | null;
  slug: string;
  blokOgrf?: string | null;
  muxPlaybackId?: string | null;
  runtimeSeconds?: number | null;
  publicationDate?: string | null;
}) {
  const thumbnail =
    muxThumbnailUrl(input.muxPlaybackId) || socialOgImageUrl(input.blokOgrf);
  const duration =
    input.runtimeSeconds != null && input.runtimeSeconds > 0
      ? Math.round(input.runtimeSeconds)
      : undefined;

  return {
    title: input.name,
    thumbnail_loc: thumbnail,
    description:
      input.description?.trim() ||
      `Watch ${input.name} — a short film on Fjorr.`,
    player_loc: absoluteUrl(`/film/${input.slug}`),
    ...(duration ? { duration } : {}),
    ...(input.publicationDate
      ? { publication_date: input.publicationDate }
      : {}),
    family_friendly: 'yes' as const,
    live: 'no' as const,
  };
}
