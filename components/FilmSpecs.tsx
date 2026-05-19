'use client';

import React, { useState, useMemo } from 'react';

interface TranscriptRow {
  language_code: string;
  content: string;
}

interface FilmSpecsProps {
  film: any;
  audioLanguages: string[];
  subtitles: Array<{ name: string; code: string }>;
  themes: string[];
  transcripts: TranscriptRow[]; // 🎯 Real rows from your transcript table
}

export default function FilmSpecs({ film, audioLanguages, subtitles, themes, transcripts }: FilmSpecsProps) {
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState('en');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const languageMap: Record<string, string> = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "it": "Italian"
  };

  // 🎯 YOUR WEWEB LOGIC: Finds the active transcript row and parses its raw string text blocks
  const parsedTranscriptCues = useMemo(() => {
    const activeRow = transcripts.find(
      (t) => t.language_code.toLowerCase().trim() === activeLanguage.toLowerCase().trim()
    );
    
    const rawVTT = activeRow?.content || "";
    if (!rawVTT) return [];

    // Splits blocks by empty lines, filters for valid timestamps, and slices down to MM:SS
    return rawVTT
      .split(/\n\s*\n/)
      .filter((b) => b.includes('-->'))
      .map((block) => {
        const lines = block.split('\n');
        const timeRow = lines.find((l) => l.includes('-->')) || "";
        const startTime = timeRow.split(' --> ')[0] || "00:00:00";
        
        const timeParts = startTime.split(':');
        const displayTime = timeParts.length >= 3 
          ? `${timeParts[1]}:${timeParts[2].split('.')[0]}` 
          : "00:00";

        return {
          displayTime,
          dialogue: lines.slice(lines.indexOf(timeRow) + 1).join(' ').trim()
        };
      });
  }, [transcripts, activeLanguage]);

  const releaseYear = film.release_date ? new Date(film.release_date).getFullYear() : '2026';
  const displayRuntime = film.runtime ? `${Math.ceil(film.runtime / 60)} min` : '1 min';
  const displayRating = film.rating?.name ? `Ages ${film.rating.name}` : 'Ages 4+';

  return (
    <div className="w-full px-[10%] text-white/90 font-sans select-none relative z-20">
      
      {/* 📖 ABOUT FILM PANEL */}
      <div className="max-w-3xl mb-12">
        <h3 className="text-[20px] font-bold text-white mb-3">About Film</h3>
        <p className="text-[16px] leading-[1.6em] text-white/80 font-medium mb-4">
          {film.description}
        </p>
        
        <div className="flex flex-wrap items-center gap-2 text-[14px] font-medium text-white/50">
          {film.location && <span>{film.location}</span>}
          {film.location && film.story_date && <span className="text-white/20">•</span>}
          {film.story_date && <span>{film.story_date}</span>}
          {film.story_date && film.note && <span className="text-white/20">•</span>}
          {film.note && <span className="italic font-normal">{film.note}</span>}
        </div>

        {/* 🪗 ACCORDION BUTTON: Opens inline directly beneath the metadata */}
        <button 
          onClick={() => setIsAccordionOpen(!isAccordionOpen)}
          className="mt-6 h-10 px-4 bg-white/10 hover:bg-white/15 active:scale-98 transition-all duration-150 rounded-[8px] inline-flex items-center gap-2 text-[14px] font-bold text-white border border-white/5 shadow-md"
        >
          <svg 
            className={`w-4 h-4 text-white/70 transition-transform duration-200 ${isAccordionOpen ? 'rotate-180' : ''}`} 
            fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          <span>Transcript</span>
        </button>
      </div>

      {/* 🪗 ACCORDION TRANSCRIPT SHELF CONTAINER */}
      {isAccordionOpen && (
        <div className="w-full max-w-3xl bg-[#151516] border border-white/5 rounded-[16px] p-6 mb-12 transition-all duration-300">
          
          {/* Dropdown Navigation Line */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="h-9 px-3 bg-white/5 hover:bg-white/10 transition-colors rounded-[6px] flex items-center gap-3 text-[13px] font-semibold text-white border border-white/5"
              >
                <span>{languageMap[activeLanguage] || activeLanguage.toUpperCase()}</span>
                <svg className="w-3.5 h-3.5 text-white/40" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Languages Dropdown Trigger Option Drawer */}
              {isDropdownOpen && subtitles.length > 0 && (
                <div className="absolute left-0 mt-2 w-40 bg-[#2C2C2E] border border-white/10 rounded-[8px] shadow-2xl overflow-hidden z-50">
                  {subtitles.map((sub, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveLanguage(sub.code);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-white/5 ${activeLanguage === sub.code ? 'text-white font-bold bg-white/5' : 'text-white/60'}`}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Parsed Dialog Timestamps Render Block */}
          <div className="w-full space-y-4 font-sans max-h-[400px] overflow-y-auto pr-2">
            {parsedTranscriptCues.length > 0 ? (
              parsedTranscriptCues.map((cue, idx) => (
                <div key={idx} className="flex items-start gap-6 text-[14px] leading-[1.5em]">
                  <span className="text-[#3A96DD] font-mono font-bold tracking-tight select-none w-12 shrink-0">{cue.displayTime}</span>
                  <span className="text-white/80 font-medium">{cue.dialogue}</span>
                </div>
              ))
            ) : (
              <div className="text-white/30 italic text-[13px] py-4">Transcript content unavailable for this language.</div>
            )}
          </div>

        </div>
      )}

      {/* 📋 TECHNICAL SPECIFICATIONS PANEL */}
      <div className="w-full max-w-4xl border-t border-white/5 pt-10">
        <h3 className="text-[20px] font-bold text-white mb-6">Technical Specs</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-12 text-[14px]">
          
          <div className="flex flex-col gap-4">
            <div className="flex items-baseline">
              <span className="w-28 text-white/40 font-medium">Runtime</span>
              <span className="text-white font-semibold">{displayRuntime}</span>
            </div>
            <div className="flex items-baseline">
              <span className="w-28 text-white/40 font-medium">Rating</span>
              <span className="text-white font-semibold">{displayRating}</span>
            </div>
            <div className="flex items-baseline">
              <span className="w-28 text-white/40 font-medium">Released</span>
              <span className="text-white font-semibold">{releaseYear}</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-baseline">
              <span className="w-28 text-white/40 font-medium">Audio</span>
              <span className="text-white font-semibold">
                {audioLanguages.join(', ')}
              </span>
            </div>
            <div className="flex items-baseline">
              <span className="w-28 text-white/40 font-medium">Subtitles</span>
              <span className="text-white font-semibold">
                {subtitles.map(s => s.name).join(', ')}
              </span>
            </div>
            <div className="flex items-baseline">
              <span className="w-28 text-white/40 font-medium">Themes</span>
              <div className="flex flex-wrap gap-1.5 items-center">
                {themes.map((tag, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-white/10 text-white/80 rounded-[2px] text-[11px] font-bold tracking-wide uppercase">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}