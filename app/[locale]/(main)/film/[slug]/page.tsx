import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import FilmStage, { type FilmStageRailItem } from '@/components/house/FilmStage';
import FilmStageLoading from '@/components/house/FilmStageLoading';
import FilmSeoCopy from '@/components/house/FilmSeoCopy';
import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site';
import { buildAlternates, absoluteLocalizedUrl } from '@/lib/seo/alternates';
import { resolveSocialOgImage } from '@/lib/og';
import {
  getFilmMetadata,
  getFilmPageData,
  getFilmSlugs,
  getFilmTranscripts,
} from '@/lib/content/film';
import { getHouseCarouselFilms } from '@/lib/content/home';
import { buildFilmVideoObject, muxThumbnailUrl } from '@/lib/seo/video';
import { vttToPlainText } from '@/lib/vtt';
import { getLocale } from 'next-intl/server';
import { parseLocale } from '@/i18n/config';

/** Must be a literal — Next.js cannot analyze imported revalidate values. */
export const revalidate = 60;
export const dynamicParams = true;

const MERCEDES_SPONSOR_ID = '0afb5b63-1e90-4a37-824d-33cc41afde3d';

function asText(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value && 'name' in value) {
    const name = (value as { name?: unknown }).name;
    return typeof name === 'string' ? name : null;
  }
  return null;
}

function formatLocationForPage(raw: unknown): string | null {
  if (!raw) return null;
  if (typeof raw === 'string') return raw.trim() || null;
  if (Array.isArray(raw)) {
    const parts = raw.map((v) => String(v).trim()).filter(Boolean);
    return parts.length ? parts.join(', ') : null;
  }
  return null;
}

function toRailItem(film: any, comingSoonHint?: boolean): FilmStageRailItem | null {
  const slug = film?.slug ? String(film.slug) : '';
  const id = film?.id ? String(film.id) : '';
  if (!slug || !id) return null;
  const release = film.release_date || film.releaseDate || null;
  const comingSoon =
    comingSoonHint ??
    (release ? new Date(release).getTime() > Date.now() : false);
  const sponsor =
    asText(film.sponsor) ||
    (film.sponsor_id === MERCEDES_SPONSOR_ID || film.sponsorId === MERCEDES_SPONSOR_ID
      ? 'Mercedes-Benz'
      : null);
  return {
    id,
    slug,
    name: film.name || 'Untitled',
    teaser: film.teaser || null,
    runtime: film.runtime ?? null,
    comingSoon,
    muxPlaybackId: film.mux_playback_id || film.muxPlaybackId || null,
    heroWide: film.hero_wide || film.heroWide || null,
    heroClsx: film.hero_clsx || film.heroClsx || null,
    heroTall: film.hero_tall || film.heroTall || null,
    blokTall: film.blok_tall || film.blokTall || null,
    blokOgrf: film.blok_ogrf || film.blokOgrf || null,
    sponsor,
    rating: asText(film.rating),
    storyDate: asText(film.story_date) || (typeof film.story_date === 'string' ? film.story_date : null),
    location: formatLocationForPage(film.location),
    titleArtCode: film.title_art_code || film.titleArtCode || null,
    titleArtHex: film.title_art_hex || film.titleArtHex || null,
    titleArtScale:
      typeof film.title_art_scale === 'number'
        ? film.title_art_scale
        : typeof film.titleArtScale === 'number'
          ? film.titleArtScale
          : null,
  };
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const slugs = await getFilmSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug: urlSlug } = await params;
  const locale = parseLocale(await getLocale());
  const film = await getFilmMetadata(urlSlug, locale);
  if (!film) return { title: 'Film Not Found' };
  const titleText = film.name;
  const descriptionText = film.teaser || 'Watch this short film on Fjorr.';
  const path = `/film/${film.slug}`;
  const canonical = absoluteLocalizedUrl(locale, path);
  const ogImageUrl = await resolveSocialOgImage(film.blok_ogrf);
  return {
    title: titleText,
    description: descriptionText,
    alternates: buildAlternates(path, locale),
    openGraph: {
      title: `${titleText} | Fjorr`,
      description: descriptionText,
      url: canonical,
      siteName: 'Fjorr',
      type: 'video.movie',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `Short film poster for ${film.name}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${titleText} | Fjorr`,
      description: descriptionText,
      images: [ogImageUrl],
    },
  };
}

export default async function FilmDetailPage({ params }: PageProps) {
  const { slug: urlSlug } = await params;
  return (
    <Suspense fallback={<FilmStageLoading />}>
      <DeferredPageContent urlSlug={urlSlug} />
    </Suspense>
  );
}

async function DeferredPageContent({ urlSlug }: { urlSlug: string }) {
  const locale = parseLocale(await getLocale());
  const [pageData, carousel] = await Promise.all([
    getFilmPageData(urlSlug, locale),
    getHouseCarouselFilms(locale),
  ]);
  if (!pageData) notFound();

  const { filmData, relatedArtifacts, subtitleTracks, creatorRows, processImages } = pageData;

  const [ogImageUrl, transcripts] = await Promise.all([
    resolveSocialOgImage(filmData.blok_ogrf),
    getFilmTranscripts(filmData.id),
  ]);

  const isComingSoon = filmData.release_date
    ? new Date(filmData.release_date).getTime() > Date.now()
    : false;

  const credits = (creatorRows || [])
    .map((row: any) => ({
      name: row?.creator?.name ? String(row.creator.name) : '',
      role: row?.role ? String(row.role) : '',
      slug: row?.creator?.slug ? String(row.creator.slug) : null,
      image: row?.creator?.image ? String(row.creator.image) : null,
    }))
    .filter((row: { name: string }) => row.name);

  const artifacts = (relatedArtifacts || [])
    .map((row: any) => row?.artifact)
    .filter(Boolean)
    .map((artifact: any) => ({
      slug: String(artifact.slug || ''),
      name: artifact.name || 'Artifact',
      image: artifact.blok_tall || artifact.hero_tall || null,
    }))
    .filter((artifact: { slug: string }) => artifact.slug);

  const currentSlug = String(filmData.slug);
  const directorNote =
    filmData.director_note ||
    // Temporary placeholders until CMS notes are filled.
    (currentSlug === 'shoebox'
      ? 'We built this the way Bowerman built shoes — on the kitchen floor, cutting what didn’t belong, keeping only what made someone faster. The myth isn’t the waffle iron. It’s the refusal to wait for permission.'
      : currentSlug === 'moonshot'
        ? 'Kennedy did not ask for a speech about the moon. He asked for a reason America should try. The film is that reason, cut short — a dare aimed at the horizon, still unfinished in the best way.'
        : null);
  const directorName =
    credits.find((c) => /director/i.test(c.role || ''))?.name || null;

  const transcriptPlain = (() => {
    const rows = transcripts || [];
    const preferred =
      rows.find((r: { language_code?: string | null }) =>
        /^en/i.test(String(r.language_code || ''))
      ) || rows[0];
    return preferred?.content ? vttToPlainText(String(preferred.content)) : '';
  })();

  const currentItem = toRailItem(filmData, isComingSoon);
  const rail: FilmStageRailItem[] = (() => {
    const seen = new Set<string>();
    const out: FilmStageRailItem[] = [];
    for (const film of carousel) {
      const item = toRailItem(film);
      if (!item || seen.has(item.slug)) continue;
      seen.add(item.slug);
      out.push(item);
    }
    if (currentItem && !seen.has(currentSlug)) {
      out.unshift(currentItem);
    } else if (currentItem) {
      const i = out.findIndex((item) => item.slug === currentSlug);
      if (i >= 0) out[i] = currentItem;
    }
    return out;
  })();

  const thumbnailUrl =
    muxThumbnailUrl(filmData.mux_playback_id) || ogImageUrl;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildFilmVideoObject({
              name: filmData.name || 'Untitled',
              description: filmData.teaser || filmData.description,
              slug: currentSlug,
              thumbnailUrl,
              uploadDate: filmData.release_date || null,
              runtimeSeconds: filmData.runtime ?? null,
              muxPlaybackId: filmData.mux_playback_id || null,
              credits,
            })
          ),
        }}
      />

      <FilmSeoCopy
        name={filmData.name || 'Untitled'}
        teaser={filmData.teaser || null}
        description={filmData.description || null}
        note={filmData.note || null}
        directorNote={directorNote}
        directorName={directorName}
        transcriptText={transcriptPlain || null}
      />

      <FilmStage
        id={String(filmData.id)}
        slug={currentSlug}
        rail={rail}
        exhibition={{
          name: filmData.name || 'Untitled',
          teaser: filmData.teaser || null,
          description: filmData.description || null,
          note: filmData.note || null,
          directorNote,
          storyDate:
            asText(filmData.story_date) ||
            (typeof filmData.story_date === 'string' ? filmData.story_date : null),
          rating: asText(filmData.rating),
          runtime: filmData.runtime ?? null,
          theme: asText(filmData.theme),
          location: formatLocationForPage(filmData.location),
          releaseDate: filmData.release_date || null,
          audioLanguages: ['English'],
          credits,
          artifacts,
          processImages:
            processImages?.length
              ? processImages
              : currentSlug === 'moonshot'
                ? [
                    {
                      id: 'moonshot-process-1',
                      url: String(filmData.hero_wide || ''),
                      thumbUrl: null,
                      caption: 'Temp — horizon study',
                    },
                    {
                      id: 'moonshot-process-2',
                      url: String(filmData.hero_clsx || ''),
                      thumbUrl: null,
                      caption: 'Temp — frame language',
                    },
                    {
                      id: 'moonshot-process-3',
                      url: String(filmData.blok_wide || ''),
                      thumbUrl: null,
                      caption: 'Temp — title board',
                    },
                    {
                      id: 'moonshot-process-4',
                      url: String(
                        filmData.blok_tall || filmData.hero_tall || ''
                      ),
                      thumbUrl: null,
                      caption: 'Temp — vertical cut',
                    },
                  ].filter((row) => row.url)
                : processImages || [],
          transcripts,
          tracks: subtitleTracks,
        }}
      />
    </>
  );
}
