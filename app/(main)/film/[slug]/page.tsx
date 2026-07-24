import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import FilmPageContentWrapper from '@/components/FilmPageContentWrapper';
import ServerSafeSkeleton from '@/components/ServerSafeSkeleton';
import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site';
import {
  getFilmMetadata,
  getFilmPageData,
  getFilmSlugs,
} from '@/lib/content/film';

/** Must be a literal — Next.js cannot analyze imported revalidate values. */
export const revalidate = 60;
export const dynamicParams = true;

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
  const film = await getFilmMetadata(urlSlug);
  if (!film) return { title: 'Film Not Found' };
  const titleText = film.name;
  const descriptionText = film.teaser || 'Watch this short film on Fjorr.';
  const canonical = absoluteUrl(`/film/${film.slug}`);
  const ogImageUrl = film.blok_ogrf || absoluteUrl('/opengraph-image.png');
  return {
    title: titleText,
    description: descriptionText,
    alternates: { canonical },
    openGraph: {
      title: `${titleText} | Fjorr`,
      description: descriptionText,
      url: canonical,
      siteName: 'Fjorr',
      type: 'video.movie',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `Short film poster for ${film.name}` }],
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
    <div className="w-full min-h-screen bg-[#1F1F1F] text-white flex flex-col items-center pt-0 -mt-[70px] relative z-0">
      <Suspense
        fallback={
          <div className="w-full flex justify-center bg-[#1F1F1F] animate-pulse">
            <div className="w-full relative aspect-[1/1.618] md:aspect-[4/3] lg:aspect-[16/9] overflow-hidden">
              <ServerSafeSkeleton variant="feature" />
              <div className="absolute inset-x-0 bottom-0 px-8 md:px-12 pb-14 md:pb-16 flex flex-col items-center md:items-start gap-4 z-10">
                <div className="w-32 h-4 bg-white/5 rounded" />
                <div className="w-64 h-12 bg-white/10 rounded-lg" />
                <div className="w-full max-w-xs h-4 bg-white/5 rounded" />
                <div className="w-40 h-10 bg-white/20 rounded-full mt-2" />
              </div>
            </div>
          </div>
        }
      >
        <DeferredPageContent urlSlug={urlSlug} />
      </Suspense>
    </div>
  );
}

async function DeferredPageContent({ urlSlug }: { urlSlug: string }) {
  const pageData = await getFilmPageData(urlSlug);
  if (!pageData) notFound();

  const { filmData, relatedArtifacts, recommendedFilms, transcripts, tagRows, creatorRows } =
    pageData;

  const displayLocation =
    Array.isArray(filmData.location) && filmData.location.length > 0
      ? filmData.location[0]
      : filmData.location || '';

  const languageNameMap: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    it: 'Italian',
  };
  const subtitlesData = transcripts.map((row: { language_code?: string; content?: string }) => {
    const cleanCode = (row.language_code || 'en').toLowerCase().trim();
    return {
      code: cleanCode,
      name: languageNameMap[cleanCode] || cleanCode.toUpperCase(),
      vtt_url: row.content,
    };
  });

  const mappedTags = tagRows.map((row: any) => row.tag?.name).filter(Boolean);
  const finalThemesList =
    mappedTags.length > 0
      ? mappedTags
      : filmData.theme?.name
        ? [filmData.theme.name]
        : [];
  // Computed per-request so "Coming Soon" flips even while film payload is cached.
  const isComingSoon = filmData.release_date
    ? new Date(filmData.release_date).getTime() > Date.now()
    : false;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Movie',
            name: filmData.name,
            description: filmData.teaser,
            image: filmData.blok_ogrf || 'https://www.fjorr.com/opengraph-image.png',
            datePublished: filmData.release_date,
            productionCompany: { '@type': 'Organization', name: 'Fjorr' },
          }),
        }}
      />

      <FilmPageContentWrapper
        filmData={filmData}
        relatedArtifacts={relatedArtifacts}
        recommendedFilms={recommendedFilms}
        transcripts={transcripts}
        subtitlesData={subtitlesData}
        finalThemesList={finalThemesList}
        creatorRows={creatorRows}
        displayLocation={displayLocation}
        isComingSoon={isComingSoon}
      />
    </>
  );
}
