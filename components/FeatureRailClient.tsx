'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import FeatureRail from './FeatureRail';
import { createBrowserClient } from '@supabase/ssr';

const CinemaTheater = dynamic(() => import('@/components/CinemaTheater'), {
  ssr: false,
});

export default function FeatureRailClient({ films }: { films: any[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showTheater, setShowTheater] = useState(false);
  const [selectedFilm, setSelectedFilm] = useState<any>(null);

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
        .select('id, name, slug, mux_playback_id, last_line, story_date, location, runtime, has_subtitles')
        .eq('slug', filmAsset.slug)
        .maybeSingle();

      if (filmError || !verifiedFilm) {
        setSelectedFilm(filmAsset);
        setShowTheater(true);
        return;
      }

      let flattenedTracks: { code: string; name: string; vtt_url: string }[] = [];

      if (verifiedFilm.has_subtitles !== false) {
        const { data: junctionTracks } = await supabase
          .from('language_subtitle')
          .select(`
            vtt_url,
            language (
              code,
              name
            )
          `)
          .eq('film_id', verifiedFilm.id);

        flattenedTracks = (junctionTracks || []).map((track: any) => ({
          code: track.language?.code || 'en',
          name: track.language?.name || 'English',
          vtt_url: track.vtt_url || '',
        }));
      }

      setSelectedFilm({
        ...verifiedFilm,
        language_subtitle: flattenedTracks,
        sponsor: filmAsset.sponsor,
      });
      setShowTheater(true);
    } catch (e) {
      console.error(e);
      setSelectedFilm(filmAsset);
      setShowTheater(true);
    }
  };

  if (!films?.length) return null;

  return (
    <div className="w-full relative bg-[#1F1F1F]">
      <FeatureRail
        films={films}
        activeIndex={activeIndex}
        onSlideChange={setActiveIndex}
        onPlayClick={handlePlayClick}
        isTheaterActive={showTheater}
      />

      {showTheater && selectedFilm && (
        <CinemaTheater
          film={selectedFilm}
          onClose={() => {
            setShowTheater(false);
            setSelectedFilm(null);
          }}
        />
      )}
    </div>
  );
}
