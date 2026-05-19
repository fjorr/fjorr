import React, { Suspense } from 'react';
import Link from 'next/link';
import { headers } from 'next/headers'; 
// 🎯 Native root alias mapping
import { createClient } from '@/utils/supabase/server'; 
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface ArtifactPageProps {
  params: Promise<{ id: string }>;
}

// =========================================================================
// 1. 🎯 THE LAYOUT WRAPPER (This satisfies Next.js build requirements)
// =========================================================================
export default async function DynamicArtifactPage({ params }: ArtifactPageProps) {
  // Invoking headers guarantees Next.js treats this entire layout node dynamically
  await headers(); 
  const { id } = await params;

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0B0B0C] flex items-center justify-center font-mono text-xs text-white/40 tracking-widest uppercase animate-pulse">
        [ Loading Secure Asset Node... ]
      </div>
    }>
      <ArtifactContent id={id} />
    </Suspense>
  );
}

// =========================================================================
// 2. 🚀 THE CONTENT ENGINE (This handles database calls and template rendering)
// =========================================================================
async function ArtifactContent({ id }: { id: string }) {
  // Initialize the server-safe backend connection utility
  const supabase = await createClient();

  const { data: artifact } = await supabase
    .from('artifact')
    .select('name, slug, teaser, description, primary_color, is_dark_bg, hero_tall')
    .eq('slug', id)
    .single();

  const customBg = artifact?.primary_color || '#0B0B0C';
  const isDarkBg = artifact?.is_dark_bg ?? true;

  // Set up text contrast themes dynamically based on your database row configuration
  const textClass = isDarkBg ? 'text-white' : 'text-black';
  const subTextClass = isDarkBg ? 'text-white/60' : 'text-black/60';
  const mutedTextClass = isDarkBg ? 'text-white/40' : 'text-black/40';
  const borderClass = isDarkBg ? 'border-white/10' : 'border-black/10';

  return (
    <div 
      style={{ backgroundColor: customBg }}
      className={`w-full min-h-screen flex flex-col justify-between transition-colors duration-500 ease-out ${textClass}`}
    >
      {/* Floating Header UI */}
      <Navbar variant={isDarkBg ? 'light' : 'dark'} />

      {/* Main Structural Layout Grid */}
      <main className="w-full flex-grow pt-36 pb-16 px-[10%] flex items-center">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 w-full">
          
          {/* Left Feature Column: Media Card asset container */}
          <div className="md:col-span-1">
            <div className={`w-full aspect-[2/3] rounded-lg border flex items-center justify-center relative overflow-hidden shadow-2xl ${borderClass} ${isDarkBg ? 'bg-zinc-900/40' : 'bg-zinc-100/40'}`}>
              {artifact?.hero_tall ? (
                <img src={artifact.hero_tall} alt={artifact.name} className="w-full h-full object-cover" />
              ) : (
                <span className={`font-mono text-[10px] tracking-widest uppercase p-4 text-center ${mutedTextClass}`}>
                  [ No Image Asset ]
                </span>
              )}
            </div>
          </div>

          {/* Right Feature Column: Editorial copy container */}
          <div className="md:col-span-2 flex flex-col justify-start gap-6 text-left">
            <div className={`font-sans text-xs tracking-widest uppercase ${mutedTextClass}`}>
              <Link href="/" className="hover:opacity-80 transition-opacity">Archive</Link> 
              <span className="mx-2">/</span> 
              <span className="opacity-80">Historical Record</span>
            </div>

            <h1 className="font-tradeGothic text-4xl md:text-6xl uppercase tracking-tighter leading-none font-black">
              {artifact?.name || id.replace(/-/g, ' ')}
            </h1>

            <hr className={`w-full ${borderClass}`} />

            <div className="flex flex-col gap-4">
              <span className={`font-mono text-xs tracking-widest uppercase ${isDarkBg ? 'text-emerald-400' : 'text-emerald-700'}`}>
                ✓ Verified Node: {artifact?.slug || id}
              </span>
              <p className={`font-sans text-base leading-relaxed ${subTextClass}`}>
                {artifact?.description || artifact?.teaser || "No description configured."}
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* Footer UI */}
      <Footer variant={isDarkBg ? 'light' : 'dark'} />
    </div>
  );
}