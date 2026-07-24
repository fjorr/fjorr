'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import FilmHero from './FilmHero';
import ArtifactRail from './ArtifactRail';
import FilmRail from './FilmRail';
import FilmSpecs from './FilmSpecs';

const CinemaTheater = dynamic(() => import('@/components/CinemaTheater'), {
  ssr: false,
});

interface WrapperProps {
  filmData: any;
  relatedArtifacts: any[];
  recommendedFilms: any[];
  transcripts: any[];
  subtitlesData: any[];
  tags: string[];
  creatorRows: any[];
  displayLocation: string;
  isComingSoon: boolean;
}

export default function FilmPageContentWrapper({
  filmData,
  relatedArtifacts,
  recommendedFilms,
  transcripts,
  subtitlesData,
  tags,
  creatorRows,
  displayLocation,
  isComingSoon,
}: WrapperProps) {
  const [showTheater, setShowTheater] = useState(false);

  return (
    <div className="w-full relative bg-[#1F1F1F]">
      {showTheater && (
        <CinemaTheater
          onClose={() => setShowTheater(false)}
          film={{
            id: filmData.id,
            name: filmData.name,
            slug: filmData.slug,
            mux_playback_id: filmData.mux_playback_id,
            last_line: filmData.last_line,
            story_date: filmData.story_date || filmData.story_year || '1972',
            location: displayLocation,
            language_subtitle: subtitlesData,
          }}
        />
      )}

      <div className="w-full">
        <FilmHero film={filmData} onPlayClick={() => setShowTheater(true)} />

        <div className="w-full bg-[#1F1F1F] pt-8 pb-24 flex flex-col items-center gap-0">
          <div className="w-full flex flex-col space-y-6">
            {relatedArtifacts.length > 0 && (
              <ArtifactRail title="Related Artifacts" artifacts={relatedArtifacts} />
            )}

            {recommendedFilms.length > 0 && (
              <FilmRail title="More Short Films" films={recommendedFilms} />
            )}
          </div>

          {!isComingSoon && (
            <div className="w-full mt-16">
              <FilmSpecs
                film={{ ...filmData, location: displayLocation }}
                audioLanguages={['English']}
                subtitles={subtitlesData}
                tags={tags}
                transcripts={transcripts}
                creators={creatorRows}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
