'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import FeatureRail from './FeatureRail'; 
import { createBrowserClient } from '@supabase/ssr';

const CinemaTheater = dynamic(() => import('@/components/CinemaTheater'), {
  ssr: false,
});

export default function FeatureRailLoader() {
  const [filmsList, setFilmsList] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  
  const [showAnchor, setShowAnchor] = useState<boolean>(true);
  const [fadeAnchor, setFadeAnchor] = useState<boolean>(false);

  const [showTheater, setShowTheater] = useState<boolean>(false);
  const [selectedFilm, setSelectedFilm] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !key) return;

        const supabase = createBrowserClient(url, key);

        const { data: collectionRow, error: collectionError } = await supabase
          .from('collection')
          .select('id')
          .eq('slug', 'featured')
          .maybeSingle();

        if (collectionError || !collectionRow) {
          console.error("Could not locate the featured collection UUID reference.");
          return;
        }

        const { data: mappedCollectionRows, error } = await supabase
          .from('collection_map')
          .select(`
            sort_order,
            film (
              id,
              name,
              slug,
              mux_playback_id,
              last_line,
              teaser,
              story_date,
              location,
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
          .order('sort_order', { ascending: true });

        if (error) {
          console.error("Junction query evaluation dropped: ", error.message);
          return;
        }

        if (mappedCollectionRows && mappedCollectionRows.length > 0) {
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

  const handlePlayClick = async (filmAsset: any) => {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) {
        setSelectedFilm(filmAsset);
        setShowTheater(true);
        return;
      }

      const supabase = createBrowserClient(url, key);

      const { data: verifiedFilm, error: filmError } = await supabase
        .from('film')
        .select('id, name, slug, mux_playback_id, last_line, story_date, location, runtime')
        .eq('slug', filmAsset.slug)
        .maybeSingle();

      if (filmError || !verifiedFilm) {
        setSelectedFilm(filmAsset);
        setShowTheater(true);
        return;
      }

      const { data: junctionTracks, error: subtitleError } = await supabase
        .from('language_subtitle')
        .select(`
          vtt_url,
          language (
            code,
            name
          )
        `)
        .eq('film_id', verifiedFilm.id);

      const flattenedTracks = (junctionTracks || []).map((track: any) => {
        return {
          code: track.language?.code || 'en',
          name: track.language?.name || 'English',
          vtt_url: track.vtt_url || ''
        };
      });

      const fullyCompiledPayload = {
        ...verifiedFilm, 
        language_subtitle: flattenedTracks,
        sponsor: filmAsset.sponsor
      };

      setSelectedFilm(fullyCompiledPayload);
      setShowTheater(true);

    } catch (e) {
      console.error(e);
      setSelectedFilm(filmAsset);
      setShowTheater(true);
    }
  };

  return (
    <div className="w-full relative bg-[#1F1F1F]">
      
      {filmsList && filmsList.length > 0 ? (
        <FeatureRail 
          films={filmsList} 
          activeIndex={activeIndex} 
          onSlideChange={setActiveIndex} 
          onPlayClick={handlePlayClick}
          isTheaterActive={showTheater} // 🎯 ADDED: Passes down theater visibility context
        />
      ) : (
        <div className="w-full flex justify-center">
          <div className="w-full max-w-[1440px] aspect-[1/1.618] md:aspect-[4/3] lg:aspect-[16/9] bg-[#1F1F1F]" />
        </div>
      )}

      {showTheater && selectedFilm && (
        <CinemaTheater 
          film={selectedFilm} 
          onClose={() => {
            setShowTheater(false);
            setSelectedFilm(null);
          }} 
        />
      )}

      {showAnchor && (
        <div className={`absolute inset-0 w-full pointer-events-none z-50 transform-gpu transition-opacity duration-500 ease-in-out ${fadeAnchor ? 'opacity-0' : 'opacity-100'}`}>
          <div className="w-full flex justify-center">
            <div className="w-full max-w-[1440px] aspect-[1/1.618] md:aspect-[4/3] lg:aspect-[16/9] bg-[#1F1F1F]" />
          </div>
        </div>
      )}

    </div>
  );
}