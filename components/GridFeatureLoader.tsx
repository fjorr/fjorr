'use client';

import React, { useState, useEffect } from 'react';
import GridFeature from './GridFeature'; 
import { createBrowserClient } from '@supabase/ssr';

export default function GridFeatureLoader() {
  const [featuredFilm, setFeaturedFilm] = useState<any>(null);
  const [diagnostic, setDiagnostic] = useState<string>("Initializing Client Gateway...");

  useEffect(() => {
    async function loadData() {
      try {
        setDiagnostic("Reading Env Credentials...");
        
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!url || !key) {
          setDiagnostic("Missing Keys inside your .env.local file configuration.");
          return;
        }

        setDiagnostic("Connecting directly to Supabase stream...");
        const supabase = createBrowserClient(url, key);

        setDiagnostic("Querying 'featured' collection mapping pipeline...");

        // 🌟 FIXED: Flattened layout query string prevents URL compilation errors
        const fetchPromise = supabase
          .from('collection')
          .select(`
            id,
            name,
            collection_map (
              film (
                id,
                name,
                slug,
                teaser,
                video_url,
                thumbnail_url,
                primary_color,
                hero_tall,
                blok_tall
              )
            )
          `)
          .eq('name', 'featured')
          .maybeSingle();

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Network connection request timed out")), 4000)
        );

        const { data, error }: any = await Promise.race([fetchPromise, timeoutPromise]);

        if (error) {
          setDiagnostic(`Database Error: ${error.message} (Code: ${error.code})`);
        } else if (data) {
          // Extract the nested relational film payload array out safely
          const filmsList = data.collection_map?.map((item: any) => item.film).filter(Boolean) || [];
          
          if (filmsList.length > 0) {
            setFeaturedFilm(filmsList[0]);
            setDiagnostic("Data loaded successfully.");
          } else {
            setDiagnostic("Found 'featured' collection, but it contains no mapped films.");
          }
        } else {
          setDiagnostic("Connected successfully, but no collection named 'featured' exists.");
        }
      } catch (err: any) {
        setDiagnostic(`Gateway Error: ${err.message || err}`);
      }
    }

    loadData();
  }, []);

  if (!featuredFilm) {
    return (
      <section className="w-full px-[10%] pb-[60px]">
        <div 
          className="w-full rounded-[12px] aspect-[1/1.618] md:aspect-[4/3] lg:aspect-[16/9] flex flex-col items-center justify-center font-sans text-[14px] p-6 text-center text-white/70" 
          style={{ backgroundColor: '#4C7A57' }}
        >
          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4" />
          <p className="font-mono text-[11px] bg-black/40 px-4 py-2 rounded border border-white/10 max-w-md break-all tracking-tight">
            {diagnostic}
          </p>
        </div>
      </section>
    );
  }

  return <GridFeature film={featuredFilm} />;
}