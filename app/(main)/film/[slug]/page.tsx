import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server'; 
import FilmPageContentWrapper from '@/components/FilmPageContentWrapper'; 
// 🎯 IMPORT YOUR NEW SERVER-SAFE BRIDGE FILE
import ServerSafeSkeleton from '@/components/ServerSafeSkeleton';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ slug: string }>;
}

// === KEEP YOUR EXISTING generateMetadata ENGINE HERE UNTOUCHED ===
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug: urlSlug } = await params;
  const supabase = await createClient();
  const { data: film } = await supabase.from('film').select('name, teaser, slug, blok_ogrf').eq('slug', urlSlug).maybeSingle();
  if (!film) return { title: 'Film Not Found' };
  const titleText = film.name;
  const descriptionText = film.teaser || 'Watch this short film on Fjorr.';
  const ogImageUrl = film.blok_ogrf || 'https://fjorr.com/og-main-preview.jpg';
  return {
    title: titleText,
    description: descriptionText,
    openGraph: { title: `${titleText} | Fjorr`, description: descriptionText, url: `https://fjorr.com/film/${film.slug}`, siteName: 'Fjorr', type: 'video.movie', images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `Short film poster for ${film.name}` }] },
    twitter: { card: 'summary_large_image', title: `${titleText} | Fjorr`, description: descriptionText, images: [ogImageUrl] },
  };
}

// 🎯 MAIN ROUTE PAGE COMPONENT
export default async function FilmDetailPage({ params }: PageProps) {
  const { slug: urlSlug } = await params;
  return (
    <div className="w-full min-h-screen bg-[#1F1F1F] text-white flex flex-col items-center pt-0 -mt-[70px] relative z-0">
      <Suspense 
        fallback={
          /* ⚡ INSTANT SERVER-STREAMED SKELETON LAYER (0ms Load Time) */
          <div className="w-full flex justify-center bg-[#1F1F1F] animate-pulse">
            <div className="w-full relative aspect-[1/1.618] md:aspect-[4/3] lg:aspect-[16/9] overflow-hidden">
              
              {/* 🎯 ONE SOURCE OF DESIGN TRUTH:
                 Your exact SkeletonLoader design paints immediately, error free! */}
              <ServerSafeSkeleton variant="feature" />
              
              {/* Wireframe element metrics overlap exactly on top */}
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
  const supabase = await createClient();
  const currentIsoString = new Date().toISOString();

  const { data: filmData, error: filmError } = await supabase.from('film').select(`*, rating ( name ), theme ( name )`).eq('slug', urlSlug).maybeSingle();
  if (filmError || !filmData) { console.error(filmError); notFound(); }

  let relatedArtifacts: any[] = [];
  let recommendedFilms: any[] = [];
  let transcripts: any[] = [];
  let tagRows: any[] = [];
  let creatorRows: any[] = [];
  // Explicit false hides captions; null/true keep existing rows visible.
  const showSubtitles = filmData.has_subtitles !== false;

  try {
    const [junctionRows, allFilmsResponse, transcriptRows, tagsResponse, creatorsResponse] = await Promise.all([
      supabase.from('film_artifact').select('sort_order, artifact:artifact_id (id, slug, name, blok_tall)').eq('film_id', filmData.id).order('sort_order', { ascending: true }),
      supabase.from('film').select('id, name, slug, blok_tall, release_date').lte('release_date', currentIsoString).not('id', 'eq', filmData.id).order('release_date', { ascending: false }).limit(12),
      showSubtitles
        ? supabase.from('transcript').select('content, language_code').eq('film_id', filmData.id)
        : Promise.resolve({ data: [] as any[] }),
      supabase.from('tag_map').select('tag:tag_id ( name )').eq('film_id', filmData.id),
      supabase.from('creator_map').select('role, creator:creator_id ( name )').eq('film_id', filmData.id).order('sort_order', { ascending: true })
    ]);
    relatedArtifacts = junctionRows.data || [];
    recommendedFilms = allFilmsResponse.data || [];
    transcripts = showSubtitles ? (transcriptRows.data || []) : [];
    tagRows = tagsResponse.data || [];
    creatorRows = creatorsResponse.data || []; 
  } catch (err) { console.warn(err); }

  const displayLocation = Array.isArray(filmData.location) && filmData.location.length > 0 ? filmData.location[0] : filmData.location || '';
  
  const languageNameMap: Record<string, string> = { en: 'English', es: 'Spanish', fr: 'French', it: 'Italian' };
  const subtitlesData = transcripts.map((row: any) => {
    const cleanCode = (row.language_code || 'en').toLowerCase().trim();
    return {
      code: cleanCode,
      name: languageNameMap[cleanCode] || cleanCode.toUpperCase(),
      vtt_url: row.content 
    };
  });

  const mappedTags = tagRows.map((row: any) => row.tag?.name).filter(Boolean);
  const finalThemesList = mappedTags.length > 0 ? mappedTags : filmData.theme?.name ? [filmData.theme.name] : [];
  const isComingSoon = filmData.release_date ? new Date(filmData.release_date).getTime() > Date.now() : false;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Movie", "name": filmData.name, "description": filmData.teaser, "image": filmData.blok_ogrf || "https://fjorr.com/og-main-preview.jpg", "datePublished": filmData.release_date, "productionCompany": { "@type": "Organization", "name": "Fjorr" } }) }} />
      
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