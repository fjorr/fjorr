import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server'; 

import FilmHero from '@/components/FilmHero';
import ArtifactRail from '@/components/ArtifactRail';
import FilmRail from '@/components/FilmRail';
import FilmSpecs from '@/components/FilmSpecs';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function FilmDetailPage({ params }: PageProps) {
  const { slug: urlSlug } = await params;

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col items-center pt-0 -mt-[70px] relative z-0">
      
      <Suspense 
        fallback={
          <div className="w-full min-h-screen bg-black text-center text-white/30 text-[14px] font-mono tracking-widest flex items-center justify-center animate-pulse">
            LOADING EXPERIENCE...
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

  // 1. 🎯 FIXED QUERY: Safely requests relation strings based on your actual column setup
  const { data: filmData, error: filmError } = await supabase
    .from('film')
    .select(`
      *,
      rating ( name ),
      theme ( name )
    `)
    .eq('slug', urlSlug)
    .maybeSingle();

  if (filmError || !filmData) {
    console.error(`Failed to fetch film profile for slug: ${urlSlug}`, filmError);
    notFound();
  }

  // 2. 🛡️ CONCURRENT SHIELD: Wrap secondary rows inside a safe container block
  let relatedArtifacts: any[] = [];
  let recommendedFilms: any[] = [];
  let transcripts: any[] = [];
  let tagRows: any[] = [];

  try {
    const [junctionRows, allFilmsResponse, transcriptRows, tagsResponse] = await Promise.all([
      supabase
        .from('film_artifact')
        .select('sort_order, artifact:artifact_id (id, slug, name, blok_tall)')
        .eq('film_id', filmData.id)
        .order('sort_order', { ascending: true }),

      supabase
        .from('film')
        .select('id, name, slug, blok_tall, release_date')
        .lte('release_date', currentIsoString)
        .not('id', 'eq', filmData.id)
        .order('release_date', { ascending: false }),

      supabase
        .from('transcript')
        .select('content, language_code')
        .eq('film_id', filmData.id),

      supabase
        .from('tag_map')
        .select('tag:tag_id ( name )')
        .eq('film_id', filmData.id)
    ]);

    relatedArtifacts = junctionRows.data || [];
    recommendedFilms = allFilmsResponse.data || [];
    transcripts = transcriptRows.data || [];
    tagRows = tagsResponse.data || [];
  } catch (err) {
    console.warn("⚠️ Secondary relational tracks failed to load, falling back gracefully:", err);
  }

  // Parse location text strings safely
  const displayLocation = Array.isArray(filmData.location) && filmData.location.length > 0 
    ? filmData.location[0] 
    : filmData.location || '';

  const subtitleLanguagesArray: string[] = Array.isArray(filmData.subtitle_languages) 
    ? filmData.subtitle_languages 
    : [];

  const languageNameMap: Record<string, string> = {
    en: 'English', es: 'Spanish', fr: 'French', it: 'Italian'
  };

  const subtitlesData = subtitleLanguagesArray.map((code: string) => {
    const cleanCode = code.toLowerCase().trim();
    return {
      name: languageNameMap[cleanCode] || cleanCode.toUpperCase(),
      code: cleanCode
    };
  });

  const mappedTags = tagRows.map((row: any) => row.tag?.name).filter(Boolean);
  const finalThemesList = mappedTags.length > 0 
    ? mappedTags 
    : filmData.theme?.name ? [filmData.theme.name] : [];

  // 🎯 FUTURE RELEASE SHIELD (COMING SOON)
  // Evaluates whether the timestamp in the database represents a future date
  const isComingSoon = filmData.release_date 
    ? new Date(filmData.release_date).getTime() > Date.now() 
    : false;

  return (
    <>
      <FilmHero film={filmData} />
      
      <div className="w-full bg-[#1F1F1F] pt-12 pb-24 flex flex-col gap-12">
        
        {relatedArtifacts.length > 0 && (
          <ArtifactRail title="Related Artifacts" artifacts={relatedArtifacts} />
        )}
        
        {recommendedFilms.length > 0 && (
          <FilmRail title="More Short Films" films={recommendedFilms} />
        )}

        {/* 🎯 CONDITIONAL SPECS DISPLAY */}
        {/* If the film is coming soon, both the horizontal rule divider and specs component are hidden */}
        {!isComingSoon && (
          <>
            <hr className="border-white/10 mx-[10%] my-4" />
            <FilmSpecs 
              film={{
                ...filmData,
                location: displayLocation
              }}
              audioLanguages={['English']}
              subtitles={subtitlesData}
              themes={finalThemesList}
              transcripts={transcripts}
            />
          </>
        )}
        
      </div>
    </>
  );
}