'use client';

import React from 'react';
import FilmTranscript from './FilmTranscript';

interface TranscriptRow {
  language_code: string;
  content: string;
}

interface CreatorMapRow {
  role: string;
  creator: {
    name: string;
  } | null;
}

interface FilmSpecsProps {
  film: any;
  audioLanguages: string[];
  subtitles: Array<{ name: string; code: string }>;
  themes: string[];
  transcripts: TranscriptRow[]; 
  creators?: CreatorMapRow[];
}

export default function FilmSpecs({ 
  film, 
  audioLanguages, 
  subtitles, 
  themes, 
  transcripts, 
  creators = [] 
}: FilmSpecsProps) {
  const releaseYear = film.release_date ? new Date(film.release_date).getFullYear() : '2026';
  const displayRuntime = film.runtime ? `${Math.ceil(film.runtime / 60)} min` : '1 min';
  const displayRating = film.rating?.name ? `Ages ${film.rating.name}` : 'Ages 4+';

  return (
    <div className="max-w-2xl w-full px-8 md:px-12 mx-auto text-left text-white/90 font-sans select-none relative z-20">
      
      {/* 📖 ABOUT FILM PANEL */}
      <div className="max-w-3xl mb-8">
        <h3 className="text-lg font-bold text-white mb-3">About Film</h3>
        <p className="text-base leading-normal text-white/80 font-medium mb-4">
          {film.description}
        </p>
        
        {/* VERTICAL METADATA STACK */}
        <div className="flex flex-col items-start gap-0.5 text-sm font-medium text-white/50">
          {film.story_date && <span>{film.story_date}</span>}
          {film.location && <span>{film.location}</span>}
          {film.note && <span className="font-normal">{film.note}</span>}
        </div>

        {/* SEPARATED CAPTIONS TRANSCRIPT MODULE */}
        <div className="mt-6">
          <FilmTranscript subtitles={subtitles} transcripts={transcripts} />
        </div>
      </div>

      {/* 📋 UNIFIED DETAILS PANEL */}
      <div className="w-full mt-14">
        <h3 className="text-lg font-bold text-white mb-6 tracking-tight">Specifications</h3>
        
        {/* A single, vertically continuous stack with tight, deliberate rhythm */}
        <div className="flex flex-col space-y-2 text-sm">
          
          {/* Dynamic Filmmaker Data Blocks */}
          {creators.map((item, idx) => (
            <div key={idx} className="flex items-baseline gap-2">
              <span className="text-white/40 font-medium capitalize">{item.role}</span>
              <span className="text-white font-semibold">{item.creator?.name || 'Unknown'}</span>
            </div>
          ))}

          {/* Technical Specifications Rows */}
          <div className="flex items-baseline gap-2">
            <span className="text-white/40 font-medium">Runtime</span>
            <span className="text-white font-semibold">{displayRuntime}</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-white/40 font-medium">Rating</span>
            <span className="text-white font-semibold">{displayRating}</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-white/40 font-medium">Released</span>
            <span className="text-white font-semibold">{releaseYear}</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-white/40 font-medium">Audio</span>
            <span className="text-white font-semibold">{audioLanguages.join(', ')}</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-white/40 font-medium">Subtitles</span>
            <span className="text-white font-semibold">
              {subtitles.map(s => s.name).join(', ')}
            </span>
          </div>

          {themes.length > 0 && (
            <div className="flex items-baseline gap-2">
              <span className="text-white/40 font-medium">Themes</span>
              <span className="text-white font-semibold">
                {themes.join(', ')}
              </span>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}