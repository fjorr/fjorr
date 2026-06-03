'use client';

import React, { useState, useEffect } from 'react';
import FilmHero from './FilmHero';
import ArtifactRail from './ArtifactRail';
import FilmRail from './FilmRail';
import FilmSpecs from './FilmSpecs';
import CinemaTheater from './CinemaTheater'; 
// 🎯 IMPORT YOUR CUSTOM DESIGN SYSTEM ENGINE:
import SkeletonLoader from '@/components/SkeletonLoader';

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
  const [showTheater, setShowTheater] = useState(false);

  // 🎬 NATIVE CROSS-FADE CURTAIN ENGINE STATES:
  const [showCurtain, setShowCurtain] = useState(true);
  const [fadeCurtain, setFadeCurtain] = useState(false);

  useEffect(() => {
    // 1. Instantly trigger the opacity transition to 0 on component boot
    setFadeCurtain(true);
    
    // 2. Completely unmount the curtain overlay layer once the 500ms fade finishes
    const timer = setTimeout(() => {
      setShowCurtain(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [filmData?.id]);

  return (
    // Relative structural wrapper anchors the absolute fading curtain overlay tightly in place
    <div className="w-full relative bg-[#1F1F1F]">
      
      {/* 🎬 THEATER OVERLAY FRAME: Mounts, clears site layout headers, and starts playback instantly */}
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
            language_subtitle: subtitlesData
          }}
        />
      )}

      {/* MAIN VIEWPORT FLOW: Fades up cleanly underneath while the curtain layer dissolves */}
      <div className="w-full animate-in fade-in duration-700 ease-out">
        {/* ACTIVATE OVERLAY ON CLICK */}
        <FilmHero film={filmData} onPlayClick={() => setShowTheater(true)} />
        
        {/* MAIN PLOT DESCRIPTION CONTENT BACKGROUND GRID */}
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
                themes={finalThemesList}
                transcripts={transcripts}
                creators={creatorRows} 
              />
            </div>
          )}
        </div>
      </div>

      {/* 🎭 THE CINEMATIC LOADING CURTAIN OVERLAY:
          Perfectly tracks your FilmHero aspect ratios to mask the text/layout assembly shifts! */}
      {showCurtain && (
        <div 
          className={`absolute top-0 inset-x-0 w-full pointer-events-none z-50 transform-gpu transition-opacity duration-500 ease-in-out ${
            fadeCurtain ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="w-full flex justify-center bg-[#1F1F1F]">
            <div className="w-full relative aspect-[1/1.618] md:aspect-[4/3] lg:aspect-[16/9] overflow-hidden">
              
              {/* Uses your signature dot matrix design skeleton */}
              <SkeletonLoader variant="feature" />
              
              {/* Wireframe shape items match the layout structure of your final FilmHero text blocks */}
              <div className="absolute inset-x-0 bottom-0 px-8 md:px-12 pb-14 md:pb-16 flex flex-col items-center md:items-start gap-4 z-10">
                <div className="w-32 h-4 bg-white/5 rounded animate-pulse" />
                <div className="w-64 h-12 bg-white/10 rounded-lg animate-pulse" />
                <div className="w-full max-w-xs h-4 bg-white/5 rounded animate-pulse" />
                <div className="w-40 h-10 bg-white/20 rounded-full mt-2 animate-pulse" />
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}