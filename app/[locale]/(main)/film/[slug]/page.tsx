import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import FilmStage, { type FilmStageRailItem } from '@/components/house/FilmStage';
import FilmStageLoading from '@/components/house/FilmStageLoading';
import FilmSeoCopy from '@/components/house/FilmSeoCopy';
import type { Metadata } from 'next';
import { buildAlternates, absoluteLocalizedUrl } from '@/lib/seo/alternates';
import { resolveSocialOgImage, socialOgImageUrl } from '@/lib/og';
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
import { buildExhibitionFilm } from '@/lib/content/exhibition-film';

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
    blokWide: film.blok_wide || film.blokWide || null,
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

  const isComingSoon = filmData.release_date
    ? new Date(filmData.release_date).getTime() > Date.now()
    : false;

  const currentSlug = String(filmData.slug);
  const exhibition = buildExhibitionFilm({
    filmData,
    creatorRows,
    relatedArtifacts,
    processImages: processImages || [],
    transcripts: [],
    subtitleTracks,
  });
  const credits = exhibition.credits;
  const directorName =
    credits.find((c) => /director/i.test(c.role || ''))?.name || null;

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
    muxThumbnailUrl(filmData.mux_playback_id) ||
    socialOgImageUrl(filmData.blok_ogrf);

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
        directorNote={exhibition.directorNote}
        directorName={directorName}
      />

      <Suspense fallback={null}>
        <FilmTranscriptSeo filmId={String(filmData.id)} name={filmData.name || 'Untitled'} />
      </Suspense>

      <FilmStage
        id={String(filmData.id)}
        slug={currentSlug}
        rail={rail}
        exhibition={exhibition}
      />
    </>
  );
}

/** Search-engine transcript. Streams after the poster and essay. */
async function FilmTranscriptSeo({ filmId, name }: { filmId: string; name: string }) {
  const transcripts = await getFilmTranscripts(filmId);
  const preferred =
    (transcripts || []).find((row: { language_code?: string | null }) =>
      /^en/i.test(String(row.language_code || ''))
    ) || transcripts?.[0];
  const transcriptText = preferred?.content
    ? vttToPlainText(String(preferred.content))
    : '';
  if (!transcriptText.trim()) return null;
  return (
    <section className="sr-only" aria-label={`${name} transcript`}>
      <h2>Transcript</h2>
      <pre>{transcriptText}</pre>
    </section>
  );
}
