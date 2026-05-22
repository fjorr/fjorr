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
          /* 🎯 CUSTOM HIGH-END FALLBACK SCREEN */
          /* Matches #1F1F1F background tone with a custom 20x20px inline CSS radial dot grid */
          <div 
            className="w-full min-h-screen text-center text-white/30 text-[14px] font-mono tracking-widest flex flex-col gap-3 items-center justify-center relative select-none animate-pulse"
            style={{
              backgroundColor: '#1F1F1F',
              backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              backgroundPosition: 'center center'
            }}
          >
            {/* Ambient indicator glowing in the middle of the grid */}
            <span className="tracking-normal font-sans font-bold text-xs text-white/40">
              Loading film.
            </span>
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

  // 1. Primary Film Profile Fetch
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

  // 2. Relational Track Safe Placeholders
  let relatedArtifacts: any[] = [];
  let recommendedFilms: any[] = [];
  let transcripts: any[] = [];
  let tagRows: any[] = [];
  let creatorRows: any[] = []; // 🎯 ADDED: Safe placeholder array for creators join

  try {
    // 🎯 UPDATED: Added creator_map relational fetch query right inside the concurrent execution grid block
    const [junctionRows, allFilmsResponse, transcriptRows, tagsResponse, creatorsResponse] = await Promise.all([
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
        .eq('film_id', filmData.id),

      // 🎯 NEW RELATION QUERY: Grabs sorting index order, inline roles, and foreign creator tables cleanly
      supabase
        .from('creator_map')
        .select('role, creator:creator_id ( name )')
        .eq('film_id', filmData.id)
        .order('sort_order', { ascending: true })
    ]);

    relatedArtifacts = junctionRows.data || [];
    recommendedFilms = allFilmsResponse.data || [];
    transcripts = transcriptRows.data || [];
    tagRows = tagsResponse.data || [];
    creatorRows = creatorsResponse.data || []; // 🎯 ASSIGNED: Loaded rows safely mapped to fallback trackers
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

  const isComingSoon = filmData.release_date 
    ? new Date(filmData.release_date).getTime() > Date.now() 
    : false;

    return (
      <>
        <FilmHero film={filmData} />
        
        {/* 🎯 FIXED: Changed gap-12 to gap-0 and pt-12 to pt-8 to tighten up the global background container */}
        <div className="w-full bg-[#1F1F1F] pt-8 pb-24 flex flex-col items-center gap-0">
          
          {/* 🚂 THE RAILS CONTAINER: Controlled separation gap solely for the slider systems */}
          <div className="w-full flex flex-col space-y-6">
            {relatedArtifacts.length > 0 && (
              <ArtifactRail title="Related Artifacts" artifacts={relatedArtifacts} />
            )}
            
            {recommendedFilms.length > 0 && (
              <FilmRail title="More Short Films" films={recommendedFilms} />
            )}
          </div>
  
          {/* 🎯 CONDITIONAL SPECS DISPLAY */}
          {!isComingSoon && (
            /* Wrapped in a small layout-dedicated class to push the text exactly where you want it */
            <div className="w-full mt-16">
              <FilmSpecs 
                film={{
                  ...filmData,
                  location: displayLocation
                }}
                audioLanguages={['English']}
                subtitles={subtitlesData}
                themes={finalThemesList}
                transcripts={transcripts}
                creators={creatorRows} 
              />
            </div>
          )}
          
        </div>
      </>
    );
  }