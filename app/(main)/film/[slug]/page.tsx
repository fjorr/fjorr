import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server'; 
import FilmPageContentWrapper from '@/components/FilmPageContentWrapper'; // 🎬 IMPORT WRAPPER
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
    <div className="w-full min-h-screen bg-black text-white flex flex-col items-center pt-0 -mt-[70px] relative z-0">
      <Suspense 
        fallback={
          <div className="w-full min-h-screen text-center text-white/30 text-[14px] font-mono tracking-widest flex flex-col gap-3 items-center justify-center relative select-none animate-pulse" style={{ backgroundColor: '#1F1F1F', backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)', backgroundSize: '20px 20px', backgroundPosition: 'center center' }}>
            <span className="tracking-normal font-sans font-bold text-xs text-white/40">Loading film.</span>
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

  try {
    const [junctionRows, allFilmsResponse, transcriptRows, tagsResponse, creatorsResponse] = await Promise.all([
      supabase.from('film_artifact').select('sort_order, artifact:artifact_id (id, slug, name, blok_tall)').eq('film_id', filmData.id).order('sort_order', { ascending: true }),
      supabase.from('film').select('id, name, slug, blok_tall, release_date').lte('release_date', currentIsoString).not('id', 'eq', filmData.id).order('release_date', { ascending: false }),
      supabase.from('transcript').select('content, language_code').eq('film_id', filmData.id),
      supabase.from('tag_map').select('tag:tag_id ( name )').eq('film_id', filmData.id),
      supabase.from('creator_map').select('role, creator:creator_id ( name )').eq('film_id', filmData.id).order('sort_order', { ascending: true })
    ]);
    relatedArtifacts = junctionRows.data || [];
    recommendedFilms = allFilmsResponse.data || [];
    transcripts = transcriptRows.data || [];
    tagRows = tagsResponse.data || [];
    creatorRows = creatorsResponse.data || []; 
  } catch (err) { console.warn(err); }

  const displayLocation = Array.isArray(filmData.location) && filmData.location.length > 0 ? filmData.location[0] : filmData.location || '';
  
  // 🎯 DATA BUILDER LAYER: Maps your loaded transcript lines directly to build a secure subtitle array payload
  const languageNameMap: Record<string, string> = { en: 'English', es: 'Spanish', fr: 'French', it: 'Italian' };
  const subtitlesData = transcripts.map((row: any) => {
    const cleanCode = (row.language_code || 'en').toLowerCase().trim();
    return {
      code: cleanCode,
      name: languageNameMap[cleanCode] || cleanCode.toUpperCase(),
      vtt_url: row.content // Seeds your video player track downloader link cleanly
    };
  });

  const mappedTags = tagRows.map((row: any) => row.tag?.name).filter(Boolean);
  const finalThemesList = mappedTags.length > 0 ? mappedTags : filmData.theme?.name ? [filmData.theme.name] : [];
  const isComingSoon = filmData.release_date ? new Date(filmData.release_date).getTime() > Date.now() : false;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Movie", "name": filmData.name, "description": filmData.teaser, "image": filmData.blok_ogrf || "https://fjorr.com/og-main-preview.jpg", "datePublished": filmData.release_date, "productionCompany": { "@type": "Organization", "name": "Fjorr" } }) }} />
      
      {/* 🎯 HAND PRE-LOADED DATA STRAIGHT INTO THE WRAPPER CONTROL ROOM */}
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