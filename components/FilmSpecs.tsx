'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';

interface TranscriptRow {
  language_code: string;
  content: string;
}

interface FilmSpecsProps {
  film: any;
  audioLanguages: string[];
  subtitles: Array<{ name: string; code: string }>;
  themes: string[];
  transcripts: TranscriptRow[]; 
}

export default function FilmSpecs({ film, audioLanguages, subtitles, themes, transcripts }: FilmSpecsProps) {
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState('en');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languageMap: Record<string, string> = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "it": "Italian"
  };

  // Close dropdown safely when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const parsedTranscriptCues = useMemo(() => {
    const activeRow = transcripts.find(
      (t) => t.language_code.toLowerCase().trim() === activeLanguage.toLowerCase().trim()
    );
    
    const rawVTT = activeRow?.content || "";
    if (!rawVTT) return [];

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

  const handleMainButtonClick = () => {
    if (!isAccordionOpen) {
      // If closed, open the shelf directly
      setIsAccordionOpen(true);
    } else {
      // If already open, click opens/closes the language option list
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  return (
    <div className="max-w-2xl w-full px-8 md:px-12 mx-auto text-left text-white/90 font-sans select-none relative z-20">
      
      {/* 📖 ABOUT FILM PANEL */}
      <div className="max-w-3xl mb-8">
        <h3 className="text-lg font-bold text-white mb-3">About Film</h3>
        <p className="text-base leading-loose text-white/80 font-medium mb-4">
          {film.description}
        </p>
        
        {/* VERTICAL METADATA STACK */}
        <div className="flex flex-col items-start gap-1.5 text-sm font-medium text-white/50">
          {film.story_date && <span>{film.story_date}</span>}
          {film.location && <span>{film.location}</span>}
          {film.note && <span className="font-normal">{film.note}</span>}
        </div>

        {/* 🎯 UNIFIED CONTROLLER: Combined Transcript + Language Filter Button */}
        <div className="relative inline-block mt-6" ref={dropdownRef}>
          <div className="inline-flex items-center bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition-all duration-150 shadow-md h-10 overflow-hidden">
            
            {/* Primary Toggle Action Zone */}
            <button 
              onClick={handleMainButtonClick}
              className="px-4 h-full flex items-center gap-2 text-sm font-bold text-white/90 active:scale-[0.98] transition-transform"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isAccordionOpen ? 'bg-[#3A96DD]' : 'bg-white/40'}`} />
              <span>Transcript ({languageMap[activeLanguage] || activeLanguage.toUpperCase()})</span>
              <svg 
                className={`w-3.5 h-3.5 text-white/50 transition-transform duration-200 ${isAccordionOpen && isDropdownOpen ? 'rotate-180' : ''}`} 
                fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Small close chevron if open, to allow collapsing the whole component block cleanly */}
            {isAccordionOpen && (
              <button
                onClick={() => {
                  setIsAccordionOpen(false);
                  setIsDropdownOpen(false);
                }}
                className="h-full border-l border-white/10 px-2.5 hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                title="Collapse Transcript"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Languages Dropdown Selection Shelf */}
          {isAccordionOpen && isDropdownOpen && subtitles.length > 0 && (
            <div className="absolute left-0 mt-2 w-44 bg-[#2C2C2E] border border-white/10 rounded-[8px] shadow-2xl overflow-hidden z-50">
              {subtitles.map((sub, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveLanguage(sub.code);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-white/5 ${activeLanguage === sub.code ? 'text-white font-semibold bg-white/5' : 'text-white/60'}`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🪗 ACCORDION TRANSCRIPT TEXT SHELF CONTAINER */}
      {isAccordionOpen && (
        <div className="w-full max-w-3xl mb-12 mt-4 transition-all duration-300">
          {/* Parsed Dialog Timestamps */}
          <div className="w-full space-y-4 font-sans max-h-[400px] overflow-y-auto pr-4 scrollbar-none">
            {parsedTranscriptCues.length > 0 ? (
              parsedTranscriptCues.map((cue, idx) => (
                <div key={idx} className="flex items-start gap-4 text-base leading-[1.5em]">
                  <span className="text-[#3A96DD] font-mono font-bold tracking-normal select-none w-12 shrink-0 pt-0.5">{cue.displayTime}</span>
                  <span className="text-white/80 font-medium">{cue.dialogue}</span>
                </div>
              ))
            ) : (
              <div className="text-white/30 italic text-[13px] py-2">Transcript content unavailable for this language.</div>
            )}
          </div>
        </div>
      )}

      {/* 📋 TECHNICAL SPECIFICATIONS PANEL */}
      <div className="w-full border-t border-white/5 pt-10">
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