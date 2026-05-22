import React from 'react';
import { createClient } from '@/utils/supabase/server'; 
import { notFound } from 'next/navigation';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArtifactSidebar } from '@/components/ArtifactSidebar';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

interface ArtifactPageProps {
  params: Promise<{ slug: string }>;
}

export default async function DynamicArtifactPage({ params }: ArtifactPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // 🛰️ DEEP GRAPH FETCH
  const { data: artifact, error } = await supabase
    .from('artifact')
    .select(`
      id,
      name,
      slug,
      label,
      description,
      teaser,
      quote,
      primary_color,
      is_dark_bg,
      hero_clsx,
      hero_tall,
      link_cta,
      link,
      release_date,
      creator_map (
        role,
        creator (name)
      ),
      film!film_artifact (
        name,
        slug,
        runtime
      )
    `)
    .eq('slug', slug)
    .maybeSingle();

  if (error || !artifact) {
    console.log("\n------------------ 🛰️ FJORR DEBUG ENGINE ------------------");
    console.log("🎯 URL SLUG:", slug);
    console.log("❌ ERROR PAYLOAD:", error?.message || "None");
    console.log("-----------------------------------------------------------\n");
    notFound();
  }

  // 🎨 CONTRAST LAYOUT CONFIGURATION
  const customBg = artifact.primary_color || '#0B0B0C';
  const isDarkBg = artifact.is_dark_bg ?? true;

  const textClass = isDarkBg ? 'text-white' : 'text-black';
  const subTextClass = isDarkBg ? 'text-white/60' : 'text-black/60';
  const mutedTextClass = isDarkBg ? 'text-white/40' : 'text-black/40';
  const borderClass = 'border-transparent';

  const releaseYear = artifact.release_date ? new Date(artifact.release_date).getFullYear() : null;

  // 🎯 FIXED TYPE COMPILATION STRIP
  const rawCreatorData = artifact.creator_map?.[0]?.creator;
  const creatorName = Array.isArray(rawCreatorData)
    ? rawCreatorData[0]?.name || ''
    : (rawCreatorData as any)?.name || '';

  const filmConnections = artifact.film || [];

  return (
    <div 
      style={{ backgroundColor: customBg }}
      className={`w-full min-h-screen flex flex-col justify-between transition-colors duration-500 ease-out ${textClass}`}
    >
      <Navbar variant={isDarkBg ? 'light' : 'dark'} />

      {/* 🚀 ASYMMETRIC MAIN WORKSPACE STAGE */}
      <main className="w-full lg:h-screen flex-grow flex flex-col lg:flex-row items-stretch lg:items-center">
        
        {/* 🎬 LEFT MEDIA CANVAS COLUMN 
            🎯 Updated width offset calculation from 350px to 400px to accommodate the roomier sidebar layout */}
        <div className="w-full lg:w-[calc(100%-400px)] h-auto lg:h-full flex items-center justify-center p-0 lg:p-12 relative">
          <picture className="w-full max-w-4xl h-auto max-h-full flex items-center justify-center transform lg:-translate-y-[35px]">
            <source media="(min-width: 768px)" srcSet={artifact.hero_clsx || artifact.hero_tall || ''} />
            <img 
              src={artifact.hero_tall || artifact.hero_clsx || ''} 
              alt={artifact.name || 'Fjorr Artifact Screen'} 
              className="w-full h-auto max-h-full object-contain block mx-auto animate-fadeIn"
            />
          </picture>
        </div>

        {/* 📊 RIGHT METADATA PANEL CONTAINER 
            🎯 Upgraded layout structure allocation from 350px to 400px to maximize internal padding breathing room */}
        <div className="w-full lg:w-[400px] lg:h-full shrink-0 flex">
          <ArtifactSidebar 
            name={artifact.name || slug.replace(/-/g, ' ')}
            label={artifact.label}
            creatorName={creatorName}
            releaseYear={releaseYear}
            description={artifact.description || artifact.teaser}
            quote={artifact.quote}
            filmConnections={filmConnections}
            linkCta={artifact.link_cta}
            link={artifact.link}
            isDarkBg={isDarkBg}
            customBg={customBg}
            textClass={textClass}
            subTextClass={subTextClass}
            mutedTextClass={mutedTextClass}
            borderClass={borderClass}
          />
        </div>

      </main>

      <Footer variant={isDarkBg ? 'light' : 'dark'} />
    </div>
  );
}