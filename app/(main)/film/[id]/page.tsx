import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

import FilmHero from '@/components/FilmHero';
import ArtifactRail from '@/components/ArtifactRail';
import FilmRail from '@/components/FilmRail';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FilmDetailPage({ params }: PageProps) {
  const { id: urlSlug } = await params;
  const currentIsoString = new Date().toISOString();

  // 1. Fetch the core film record using the text slug
  const { data: filmData, error: filmError } = await supabase
    .from('film')
    .select('*')
    .eq('slug', urlSlug)
    .single();

  if (filmError || !filmData) {
    console.error(`Failed to fetch film profile for slug: ${urlSlug}`, filmError);
    notFound();
  }

  // 2. Fetch everything else concurrently (No loaders, no middle-men)
  const [junctionRows, allFilmsResponse] = await Promise.all([
    supabase
      .from('film_artifact')
      .select(`
        sort_order,
        artifact:artifact_id (id, slug, name, blok_tall)
      `)
      .eq('film_id', filmData.id)
      .order('sort_order', { ascending: true }),

    supabase
      .from('film')
      .select('id, name, slug, blok_tall, release_date')
      .lte('release_date', currentIsoString) // Only published movies
      .not('id', 'eq', filmData.id)          // 🎯 CLEANEST FILTRATION: Drops the active movie directly at the database level
      .order('release_date', { ascending: false })
  ]);

  const relatedArtifacts = junctionRows.data || [];
  const recommendedFilms = allFilmsResponse.data || [];

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col items-center pt-0 -mt-[70px] relative z-0">
      
      {/* 🎬 Section 1: Hero Video Feature */}
      <FilmHero film={filmData} />
      
      {/* 📦 Section 2: Complete Content Shelf Layout */}
      <div className="w-full bg-[#1D1D1F] pt-12 pb-24 flex flex-col gap-4">
        
        {/* 🏺 Track A: Artifacts linked directly to this movie */}
        <ArtifactRail title="Related Artifacts" artifacts={relatedArtifacts} />
        
        {/* 🎬 Track B: Rest of the library catalog (Self-movie filtered out) */}
        <FilmRail title="More Short Films" films={recommendedFilms} />
        
      </div>
      
    </div>
  );
}