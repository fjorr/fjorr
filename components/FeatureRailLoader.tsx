'use client';

import React, { useState, useEffect } from 'react';
import FeatureRail from './FeatureRail'; 
import { createBrowserClient } from '@supabase/ssr';

export default function FeatureRailLoader() {
  const [filmsList, setFilmsList] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  
  const [showAnchor, setShowAnchor] = useState<boolean>(true);
  const [fadeAnchor, setFadeAnchor] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !key) return;

        const supabase = createBrowserClient(url, key);

        // 🛠️ STEP 1: Find the internal dynamic UUID token for our "featured" category slug row
        const { data: collectionRow, error: collectionError } = await supabase
          .from('collection')
          .select('id')
          .eq('slug', 'featured')
          .maybeSingle();

        if (collectionError || !collectionRow) {
          console.error("Could not locate the featured collection UUID reference.");
          return;
        }

        // 🛠️ STEP 2: Query the junction table and enforce your 'sort_order' priorities
        const { data: mappedCollectionRows, error } = await supabase
          .from('collection_map')
          .select(`
            sort_order,
            film (
              id,
              name,
              slug,
              teaser,
              story_date,
              hero_wide,
              hero_clsx,
              hero_tall,
              title_art_code,
              title_art_hex,
              runtime,
              rating ( name ),
              theme ( name ),
              sponsor:sponsor_id ( name )
            )
          `)
          .eq('collection_id', collectionRow.id)
          /* 🎯 THE FIX: Orders rows directly by your custom database sort_order integers ascending (1, 2...) */
          .order('sort_order', { ascending: true });

        if (error) {
          console.error("Junction sorted query evaluation dropped: ", error.message);
          return;
        }

        if (mappedCollectionRows && mappedCollectionRows.length > 0) {
          // Extract nested relational data objects cleanly
          const processedFilms = mappedCollectionRows
            .map((row: any) => {
              const f = row.film;
              if (!f) return null;
              
              return {
                ...f,
                sponsor: typeof f.sponsor === 'object' && f.sponsor !== null
                  ? (f.sponsor as any).name 
                  : f.sponsor
              };
            })
            .filter(Boolean);

          setFilmsList(processedFilms);
          setFadeAnchor(true);
          
          setTimeout(() => {
            setShowAnchor(false);
          }, 500);
        }
      } catch (err) {
        console.error("Loader sort integration exception: ", err);
      }
    }

    loadData();
  }, []);

  return (
    <div className="w-full relative bg-[#1F1F1F]">
      
      {/* SAFE RENDERING ENGINE DISPLAY PIPELINE */}
      {filmsList && filmsList.length > 0 ? (
        <FeatureRail 
          films={filmsList} 
          activeIndex={activeIndex} 
          onSlideChange={setActiveIndex} 
        />
      ) : (
        <div className="w-full flex justify-center">
          <div className="w-full max-w-[1440px] aspect-[1/1.618] md:aspect-[4/3] lg:aspect-[16/9] bg-[#1F1F1F]" />
        </div>
      )}

      {/* SKELETON REVEAL SYSTEM MASK CONTAINER */}
      {showAnchor && (
        <div 
          className={`absolute inset-0 w-full pointer-events-none z-50 transform-gpu transition-opacity duration-500 ease-in-out ${
            fadeAnchor ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="w-full flex justify-center">
            <div className="w-full max-w-[1440px] aspect-[1/1.618] md:aspect-[4/3] lg:aspect-[16/9] bg-[#1F1F1F]" />
          </div>
        </div>
      )}

    </div>
  );
}