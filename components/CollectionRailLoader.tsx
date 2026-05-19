'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import FilmRail from './FilmRail';

interface CollectionRailLoaderProps {
  collectionName: string; // e.g. "staff-picks"
  displayTitle: string;   // e.g. "Staff Favorites"
}

export default function CollectionRailLoader({ collectionName, displayTitle }: CollectionRailLoaderProps) {
  const [films, setFilms] = useState<any[]>([]);

  useEffect(() => {
    async function loadCollection() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!, 
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data, error } = await supabase
        .from('collection')
        .select(`
          name,
          collection_map (
            film ( 
              id, 
              name, 
              slug, 
              blok_tall, 
              hero_tall 
            )
          )
        `)
        .eq('name', collectionName)
        .maybeSingle();

      if (error) {
        console.error(`Collection query execution failure [${collectionName}]:`, error);
        return;
      }

      if (data?.collection_map) {
        // Flatten the data out from your pivot table mapping cleanly
        const extractedFilms = data.collection_map
          .map((item: any) => item.film)
          .filter(Boolean);
        setFilms(extractedFilms);
      }
    }
    loadCollection();
  }, [collectionName]);

  if (films.length === 0) return null;
  return <FilmRail title={displayTitle} films={films} />;
}