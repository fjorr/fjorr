import React from 'react';
import Link from 'next/link';
// 🌟 Switch this from browser client to your server client utility
import { createClient } from '../../../utils/supabase/server'; 
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// 🎯 Force Next.js to render this page dynamically on demand
export const dynamic = 'force-dynamic';

interface ArtifactPageProps {
  params: Promise<{ id: string }>;
}

export default async function DynamicArtifactPage({ params }: ArtifactPageProps) {
  const { id } = await params;

  // 🌟 Initialize the server-safe client instead
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
      {/* 🎯 THE NAVBAR: Floating perfectly right over your database background color! 
          It automatically flips to 'dark' typography if your background color is light. */}
      <Navbar variant={isDarkBg ? 'light' : 'dark'} />

      {/* Main Column Grid Layout Container */}
      <main className="w-full flex-grow pt-36 pb-16 px-[10%] flex items-center">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 w-full">
          
          {/* Left Media Column: Image Card */}
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

          {/* Right Column: Editorial Text space */}
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

      {/* 🎯 THE FOOTER: Perfectly inheriting the page background color canvas edge-to-edge */}
      <Footer variant={isDarkBg ? 'light' : 'dark'} />
    </div>
  );
}