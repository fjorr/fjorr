'use client';

import React, { useState } from 'react';
import FilmHero from './FilmHero';
import ArtifactRail from './ArtifactRail';
import FilmRail from './FilmRail';
import FilmSpecs from './FilmSpecs';
import CinemaTheater from './CinemaTheater.tsx'; // 🎬 Imports the cinema layout module

interface WrapperProps {
  filmData: any;
  relatedArtifacts: any[];
  recommendedFilms: any[];
  transcripts: any[];
  subtitlesData: any[];
  finalThemesList: any[];
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
  finalThemesList,
  creatorRows,
  displayLocation,
  isComingSoon
}: WrapperProps) {
  // 🎯 THE DIRECT, UNBREAKABLE RECOVERY STATE SWITCH
  const [showTheater, setShowTheater] = useState(false);

  return (
    <>
      {/* 🎬 THEATER OVERLAY LAYER: Mounts and unlocks audio instantly on state switch */}
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
            
            // 🎯 FIXED: Feed the component your parsed data array directly!
            language_subtitle: subtitlesData
          }}
        />
      )}

      {/* 📄 PASS THE STATE FUNCTION DIRECTLY INTO THE HERO BUTTON PROP */}
      <FilmHero film={filmData} onPlayClick={() => setShowTheater(true)} />
      
      {/* MAIN DESCRIPTION CONTENT BACKGROUND GRID */}
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
              film={{
                ...filmData,
                location: displayLocation
              }}
              audioLanguages={['English']}
              subtitles={subtitlesData}
              themes={finalThemesList}
              transcripts={transcripts}
              creators={creatorRows} 
            />
          </div>
        )}
      </div>
    </>
  );
}