import React, { Suspense } from 'react';
import { createClient } from '@/utils/supabase/server'; 
import { notFound } from 'next/navigation';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArtifactSidebar } from '@/components/ArtifactSidebar';
import ServerSafeSkeleton from '@/components/ServerSafeSkeleton';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

interface ArtifactPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ArtifactPageProps): Promise<Metadata> {
  const { slug: urlSlug } = await params;
  const supabase = await createClient();
  const { data: artifact } = await supabase.from('artifact').select('name, teaser, slug, blok_ogrf').eq('slug', urlSlug).maybeSingle();
  if (!artifact) return { title: 'Artifact Not Found' };
  const titleText = artifact.name;
  const descriptionText = artifact.teaser || 'Explore this cultural artifact on Fjorr.';
  const ogImageUrl = artifact.blok_ogrf || 'https://fjorr.com/og-main-preview.jpg';
  return {
    title: titleText,
    description: descriptionText,
    openGraph: { title: `${titleText} | Fjorr`, description: descriptionText, url: `https://fjorr.com/artifact/${artifact.slug}`, siteName: 'Fjorr', type: 'article', images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `Archive preview for ${artifact.name}` }] },
    twitter: { card: 'summary_large_image', title: `${titleText} | Fjorr`, description: descriptionText, images: [ogImageUrl] },
  };
}

export default async function DynamicArtifactPage({ params }: ArtifactPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: colorTokens } = await supabase
    .from('artifact')
    .select('primary_color, is_dark_bg')
    .eq('slug', slug)
    .maybeSingle();

  const customBg = colorTokens?.primary_color || '#0B0B0C';
  const isDarkBg = colorTokens?.is_dark_bg ?? true;

  const textClass = isDarkBg ? 'text-white' : 'text-black';
  const targetedDotOpacity = isDarkBg ? 0.3 : 0.65;
  const borderClass = 'opacity-0 border-none !border-transparent';

  return (
    <div 
      style={{ backgroundColor: customBg }}
      className={`w-full min-h-screen flex flex-col justify-between select-none transition-colors duration-500 ease-out ${textClass}`}
    >
      <Navbar variant={isDarkBg ? 'light' : 'dark'} />

      <Suspense 
        fallback={
          <main className="w-full lg:h-screen flex-grow flex flex-col lg:flex-row items-stretch lg:items-center relative z-0">
            <div className="w-full lg:w-[calc(100%-400px)] h-auto lg:h-full flex items-center justify-center p-0 md:p-10 lg:p-12 relative z-0 flex-grow">
              <div className="w-full max-w-[400px] md:max-w-4xl max-h-screen overflow-hidden transform lg:-translate-y-[35px] relative">
                <div className="relative w-full aspect-[1/1.618] sm:aspect-[4/3] md:aspect-[16/10] z-10">
                  <div className="absolute inset-0 w-full h-full z-0">
                    <ServerSafeSkeleton 
                      variant="feature" 
                      backgroundColor={customBg} 
                      isDarkBg={isDarkBg} 
                      dotOpacity={targetedDotOpacity} 
                    />
                  </div>
                </div>
              </div>
            </div>

            <ArtifactSidebar 
              name=""
              label={null}
              creatorName=""
              releaseYear={null}
              description={null}
              quote={null}
              filmConnections={[]}
              linkCta={null}
              link={null}
              isDarkBg={isDarkBg}
              customBg={customBg}
              textClass={textClass}
              subTextClass=""
              mutedTextClass=""
              borderClass={borderClass}
              isLoader={true} 
            />
          </main>
        }
      >
        <DeferredArtifactContent urlSlug={slug} customBg={customBg} isDarkBg={isDarkBg} textClass={textClass} borderClass={borderClass} />
      </Suspense>

      <Footer variant={isDarkBg ? 'light' : 'dark'} />
    </div>
  );
}

async function DeferredArtifactContent({ 
  urlSlug, 
  customBg, 
  isDarkBg,
  textClass,
  borderClass
}: { 
  urlSlug: string; 
  customBg: string; 
  isDarkBg: boolean;
  textClass: string;
  borderClass: string;
}) {
  const supabase = await createClient();

  // 1. Fetch core artifact metadata metrics
  const { data: artifact, error } = await supabase
    .from('artifact')
    .select(`
      id, name, slug, label, description, teaser, quote, primary_color, is_dark_bg, hero_clsx, hero_tall, blok_ogrf, link_cta, link, release_date,
      film!film_artifact ( name, slug, runtime )
    `)
    .eq('slug', urlSlug)
    .maybeSingle();

  if (error || !artifact) {
    notFound();
  }

  /* 🎯 THE BULLETPROOF FIX: 
     Since the main join filter is dropped by the query engine parser, we run an 
     isolated lookup query directly on creator_map using the resolved artifact.id.
  */
  const { data: mappingRows } = await supabase
    .from('creator_map')
    .select(`
      creator ( name )
    `)
    .eq('artifact_id', artifact.id);

  // Parse out the nested string securely from the mapping query rows
  const rawCreatorObj = (mappingRows as any)?.[0]?.creator;
  const creatorName = rawCreatorObj?.name || '';

  const subTextClass = isDarkBg ? 'text-white/60' : 'text-black/60';
  const mutedTextClass = isDarkBg ? 'text-white/40' : 'text-black/40';
  const releaseYear = artifact.release_date ? new Date(artifact.release_date).getFullYear() : null;
  const filmConnections = artifact.film || [];

  return (
    <main className="w-full lg:h-screen flex-grow flex flex-col lg:flex-row items-stretch lg:items-center animate-in fade-in duration-500 ease-out text-current relative z-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            "name": artifact.name,
            "description": artifact.description || artifact.teaser,
            "image": artifact.blok_ogrf || artifact.hero_tall || "https://fjorr.com/og-main-preview.jpg",
            "dateCreated": artifact.release_date,
            "creator": { "@type": "Person", "name": creatorName || "Fjorr Contributor" },
            "publisher": { "@type": "Organization", "name": "Fjorr" }
          })
        }}
      />

      {/* LEFT MEDIA CANVAS COLUMN */}
      <div className="w-full lg:w-[calc(100%-400px)] h-auto lg:h-full flex items-center justify-center p-0 lg:p-12 relative z-0 flex-grow">
        <picture className="w-full max-w-4xl h-auto max-h-full flex items-center justify-center transform lg:-translate-y-[35px]">
          <source media="(min-width: 768px)" srcSet={artifact.hero_clsx || artifact.hero_tall || ''} />
          <img 
            src={artifact.hero_tall || artifact.hero_clsx || ''} 
            alt={artifact.name || 'Fjorr Artifact Screen'} 
            className="w-full h-auto max-h-full object-contain block mx-auto animate-fadeIn"
          />
        </picture>
      </div>

      {/* RIGHT METADATA PANEL CONTAINER */}
      <ArtifactSidebar 
        name={artifact.name || urlSlug.replace(/-/g, ' ')}
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
    </main>
  );
}