'use client';

import React, { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import FilmHero from './FilmHero';
import ArtifactRail from './ArtifactRail';
import FilmRail from './FilmRail';
import FilmSpecs from './FilmSpecs';
import FilmTranscript from './FilmTranscript';

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
  const [startAt, setStartAt] = useState<number | undefined>(undefined);
  const [seekTo, setSeekTo] = useState<number | null>(null);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [shareSeconds, setShareSeconds] = useState<number | null>(null);
  const theaterOpenRef = React.useRef(false);

  useEffect(() => {
    theaterOpenRef.current = showTheater;
  }, [showTheater]);

  // Deep link: /film/slug?t=84 opens the theater at that second.
  useEffect(() => {
    if (isComingSoon) return;
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('t');
    if (!raw) return;
    const seconds = Number(raw);
    if (!Number.isFinite(seconds) || seconds < 0) return;
    setStartAt(seconds);
    setShareSeconds(seconds);
    setShowTheater(true);
  }, [isComingSoon]);

  const openFromTime = useCallback((seconds: number) => {
    setPlaybackTime(seconds);
    setShareSeconds(seconds);
    if (theaterOpenRef.current) {
      setSeekTo(seconds);
      return;
    }
    setStartAt(seconds);
    setSeekTo(null);
    setShowTheater(true);
  }, []);

  const handleCloseTheater = useCallback(() => {
    setShowTheater(false);
    setStartAt(undefined);
    setSeekTo(null);
    setPlaybackTime(0);
    const url = new URL(window.location.href);
    if (url.searchParams.has('t')) {
      url.searchParams.delete('t');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, []);

  const handlePlayClick = useCallback(() => {
    setStartAt(undefined);
    setSeekTo(null);
    setShowTheater(true);
  }, []);

  const handleTimeUpdate = useCallback((seconds: number) => {
    setPlaybackTime(seconds);
    if (seconds >= 1) setShareSeconds(seconds);
  }, []);

  return (
    <div className="w-full relative bg-[#1F1F1F]">
      {showTheater && (
        <>
          <CinemaTheater
            onClose={handleCloseTheater}
            startAt={startAt}
            seekTo={seekTo}
            onSeekHandled={() => setSeekTo(null)}
            onTimeUpdate={handleTimeUpdate}
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

          {subtitlesData.length > 0 && (
            <aside className="fixed top-0 right-0 z-[85] hidden lg:flex w-[min(360px,34vw)] h-[100svh] flex-col border-l border-white/10 bg-[#1a1a1a]/95 backdrop-blur-xl pt-16 pb-6 px-4">
              <FilmTranscript
                variant="dock"
                subtitles={subtitlesData}
                transcripts={transcripts}
                filmSlug={filmData.slug}
                activeTime={playbackTime}
                onSeek={(seconds) => {
                  setSeekTo(seconds);
                  setPlaybackTime(seconds);
                  setShareSeconds(seconds);
                }}
              />
            </aside>
          )}
        </>
      )}

      <div className="w-full">
        <FilmHero
          film={filmData}
          onPlayClick={handlePlayClick}
          shareSeconds={shareSeconds}
        />

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
                onSeek={openFromTime}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
