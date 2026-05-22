'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';

interface TranscriptRow {
  language_code: string;
  content: string;
}

interface FilmTranscriptProps {
  subtitles: Array<{ name: string; code: string }>;
  transcripts: TranscriptRow[];
}

export default function FilmTranscript({ subtitles, transcripts }: FilmTranscriptProps) {
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languageMap: Record<string, string> = {
    "en": "English", "es": "Spanish", "fr": "French", "it": "Italian"
  };

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
    if (!activeLanguage) return [];
    
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

  return (
    <div className="w-full">
      
      {/* 🎯 FLEX ANCHOR PACK: Links the controller button and the inline X fade button together */}
      <div className="flex items-center gap-2">
        
        <div className="relative inline-block" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`h-9 px-4 inline-flex items-center justify-center gap-2 rounded-[8px] text-sm font-semibold tracking-normal transition-all duration-150 select-none active:scale-[0.98] ${
              isAccordionOpen 
                ? 'text-white bg-white/10' 
                : 'text-white/60 bg-white/5 hover:bg-white/10'
            }`}
          >
            <svg 
              className={`w-5 h-5 shrink-0 transition-colors duration-200 ${
                isAccordionOpen ? 'text-[#76c3ff]' : 'text-white/60'
              }`}
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <rect width="18" height="14" x="3" y="5" rx="3" />
              <path d="M11 10h-2a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h2" />
              <path d="M17 10h-2a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h2" />
            </svg>

            <span>
              {isAccordionOpen && activeLanguage
                ? `Transcript - ${languageMap[activeLanguage] || activeLanguage.toUpperCase()}`
                : 'Transcript'
              }
            </span>
          </button>

          {/* Dropdown Options (Purely displays language filters now) */}
          {isDropdownOpen && (
            <div className="absolute left-0 mt-2 w-48 bg-[#2a2a2a] rounded-[8px] shadow-2xl overflow-hidden z-50 px-1 py-1">
              {subtitles.map((sub, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveLanguage(sub.code);
                    setIsAccordionOpen(true);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-5 py-2.5 text-sm font-sans font-semibold tracking-normal transition-colors rounded-[6px] hover:bg-white/5 ${
                    isAccordionOpen && activeLanguage === sub.code 
                      ? 'text-[#76c3ff] font-bold bg-white/[0.02]' 
                      : 'text-white/80'
                  }`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 🎯 FADE-IN CLOSE BUTTON TRIGGER */}
        <button
          onClick={() => {
            setIsAccordionOpen(false);
            setActiveLanguage('');
            setIsDropdownOpen(false);
          }}
          aria-label="Close transcript"
          className={`h-9 w-9 inline-flex items-center justify-center rounded-[8px] bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all duration-200 select-none active:scale-[0.95] ${
            isAccordionOpen 
              ? 'opacity-100 scale-100 pointer-events-auto' 
              : 'opacity-0 scale-95 pointer-events-none'
          }`}
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.75" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

      </div>

      {/* 🪗 ACCORDION CONTENT DISPLAY LIST */}
      {isAccordionOpen && activeLanguage && (
        <div className="w-full max-w-3xl mb-12 mt-6 transition-all duration-300">
          <div className="w-full space-y-4 font-sans max-h-[400px] overflow-y-auto pr-4 scrollbar-none">
            {parsedTranscriptCues.length > 0 ? (
              parsedTranscriptCues.map((cue, idx) => (
                <div key={idx} className="flex items-start gap-4 text-base leading-[1.5em]">
                  <span className="text-[#76c3ff] font-mono font-medium text-sm tracking-normal select-none w-12 shrink-0 pt-0.5">
                    {cue.displayTime}
                  </span>
                  <span className="text-white/80 font-medium">
                    {cue.dialogue}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-white/30 italic text-[13px] py-2">
                Transcript content unavailable for this language.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}