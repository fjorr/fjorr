import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import EmbedFilmPlayer from '@/components/EmbedFilmPlayer';
import { getFilmPageData, getFilmSlugs } from '@/lib/content/film';
import { absoluteUrl } from '@/lib/site';
import { socialOgImageUrl } from '@/lib/og';

export const revalidate = 60;

const languageNameMap: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  it: 'Italian',
};

export async function generateStaticParams() {
  const slugs = await getFilmSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getFilmPageData(slug);
  if (!page) return { title: 'Embed' };
  const { filmData } = page;
  return {
    title: filmData.name || 'Fjorr',
    description: filmData.teaser || undefined,
    robots: { index: false, follow: false },
    openGraph: {
      title: filmData.name || 'Fjorr',
      description: filmData.teaser || undefined,
      url: absoluteUrl(`/embed/film/${slug}`),
      images: [{ url: socialOgImageUrl(filmData.blok_ogrf) }],
    },
  };
}

export default async function EmbedFilmPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { slug } = await params;
  const { t } = await searchParams;
  const page = await getFilmPageData(slug);
  if (!page) notFound();

  const { filmData, transcripts } = page;
  const startAt = t && Number.isFinite(Number(t)) ? Math.max(0, Number(t)) : 0;

  const displayLocation =
    Array.isArray(filmData.location) && filmData.location.length > 0
      ? filmData.location[0]
      : filmData.location || '';

  const languageSubtitle = (transcripts || []).map(
    (row: { language_code?: string; content?: string }) => {
      const cleanCode = (row.language_code || 'en').toLowerCase().trim();
      return {
        code: cleanCode,
        name: languageNameMap[cleanCode] || cleanCode.toUpperCase(),
        vtt_url: row.content || '',
      };
    }
  );

  return (
    <main className="w-screen h-screen bg-black overflow-hidden">
      <EmbedFilmPlayer
        film={{
          id: filmData.id,
          name: filmData.name,
          slug: filmData.slug,
          teaser: filmData.teaser,
          mux_playback_id: filmData.mux_playback_id,
          last_line: filmData.last_line,
          story_date: filmData.story_date || filmData.story_year || '',
          location: displayLocation,
          blok_tall: filmData.blok_tall,
          hero_wide: filmData.hero_wide,
          hero_clsx: filmData.hero_clsx,
          release_date: filmData.release_date,
          language_subtitle: languageSubtitle,
        }}
        startAt={startAt}
      />
    </main>
  );
}
