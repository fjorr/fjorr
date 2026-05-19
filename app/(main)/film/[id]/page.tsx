import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

import FilmHero from '@/components/FilmHero';
import ArtifactRail from '@/components/ArtifactRail';
import FilmRail from '@/components/FilmRail';
import FilmSpecs from '@/components/FilmSpecs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FilmDetailPage({ params }: PageProps) {
  // 🎯 ZERO BLOCKING: Read the slug string instantly from the URL
  const { id: urlSlug } = await params;

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col items-center pt-0 -mt-[70px] relative z-0">
      
      {/* ⏳ Defer all data tasks completely into the Suspense wrapper container */}
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

// 📦 DYNAMIC CONTENT ENGINE: Houses all fetches safely underneath the Suspense boundary
async function DeferredPageContent({ urlSlug }: { urlSlug: string }) {
  const currentIsoString = new Date().toISOString();

  // 1. Fetch the primary film record along with its basic relation name strings
  const { data: filmData, error: filmError } = await supabase
    .from('film')
    .select(`
      *,
      rating:rating ( name ),
      theme:theme ( name )
    `)
    .eq('slug', urlSlug)
    .single();

  if (filmError || !filmData) {
    console.error(`Failed to fetch film profile for slug: ${urlSlug}`, filmError);
    notFound();
  }

  // 2. Concurrently pull rails, scripts, and tag configurations
  const [junctionRows, allFilmsResponse, transcriptRows, tagRows] = await Promise.all([
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

  const relatedArtifacts = junctionRows.data || [];
  const recommendedFilms = allFilmsResponse.data || [];

  // Parse location text strings out of your database arrays cleanly
  const displayLocation = Array.isArray(filmData.location) && filmData.location.length > 0 
    ? filmData.location[0] 
    : filmData.location || '';

  // Parse direct 'subtitle_languages' text[] column strings into selector items
  const subtitleLanguagesArray: string[] = Array.isArray(filmData.subtitle_languages) 
    ? filmData.subtitle_languages 
    : [];

  const languageNameMap: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    it: 'Italian'
  };

  const subtitlesData = subtitleLanguagesArray.map((code: string) => {
    const cleanCode = code.toLowerCase().trim();
    return {
      name: languageNameMap[cleanCode] || cleanCode.toUpperCase(),
      code: cleanCode
    };
  });

  // Extract multi-select tag strings
  const mappedTags = (tagRows.data || []).map((row: any) => row.tag?.name).filter(Boolean);
  const finalThemesList = mappedTags.length > 0 
    ? mappedTags 
    : filmData.theme?.name ? [filmData.theme.name] : [];

  return (
    <>
      {/* 🎬 Section 1: Hero Video Feature Display */}
      <FilmHero film={filmData} />
      
      {/* 📦 Section 2: Relational Shelves & Information Grid Area */}
      <div className="w-full bg-[#1D1D1F] pt-12 pb-24 flex flex-col gap-12">
        
        <ArtifactRail title="Related Artifacts" artifacts={relatedArtifacts} />
        
        <FilmRail title="More Short Films" films={recommendedFilms} />

        <hr className="border-white/10 mx-[10%] my-4" />
        
        <FilmSpecs 
          film={{
            ...filmData,
            location: displayLocation
          }}
          audioLanguages={['English']}
          subtitles={subtitlesData}
          themes={finalThemesList}
          transcripts={transcriptRows.data || []}
        />
        
      </div>
    </>
  );
}