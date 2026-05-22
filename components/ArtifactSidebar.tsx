import React from 'react';
import Link from 'next/link';

interface FilmItem {
  name?: string | null;
  slug?: string | null;
  runtime?: number | string | null;
}

interface ArtifactSidebarProps {
  name: string;
  label: string | null;
  creatorName: string;
  releaseYear: number | null;
  description: string | null;
  quote: string | null;
  filmConnections: FilmItem[];
  linkCta: string | null;
  link: string | null;
  isDarkBg: boolean;
  customBg: string;
  textClass: string;
  subTextClass: string;
  mutedTextClass: string;
  borderClass: string;
}

export function ArtifactSidebar({
  name,
  label,
  creatorName,
  releaseYear,
  description,
  quote,
  filmConnections,
  linkCta,
  link,
  isDarkBg,
  customBg,
  textClass,
  subTextClass,
  mutedTextClass,
  borderClass,
}: ArtifactSidebarProps) {
  
  // 🎯 UTILITY: Formats a string to guarantee it acts as a fully absolute external link path
  const formatExternalUrl = (url: string | null | undefined): string => {
    if (!url) return '#';
    const trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  return (
    <div 
      style={{ backgroundColor: customBg }}
      className={`w-full lg:w-[350px] shrink-0 flex flex-col justify-start p-8 md:p-10 lg:pt-[110px] lg:border-l ${borderClass}`}
    >
      
      {/* STATIC TOP CAP */}
      <span className={`text-[11px] uppercase font-mono tracking-[0.2em] font-bold mb-2 ${mutedTextClass}`}>
        Film Artifact
      </span>

      {/* ARTIFACT NAME */}
      <h1 className="font-sans text-2xl Capitilize tracking-tighter leading-none font-black mb-2">
        {name}
      </h1>

{/* METADATA SLAT (Stacked Vertically - Identical Font Specs) */}
<div className={`flex flex-col items-start gap-y-0.5 mb-5 ${subTextClass}`}>
  {creatorName && <span className="font-sans text-sm font-medium leading-tight capitalize">{creatorName}</span>}
  {label && <span className="font-sans text-sm font-medium leading-tight capitalize">{label}</span>}
  {releaseYear && <span className="font-sans text-sm font-medium leading-tight capitalize">{releaseYear}</span>}
</div>

{/* QUOTE SECTION */}
{quote && (
  <>
    {description && <hr className={`w-full my-0 ${borderClass}`} />}
    {/* 🎯 NORMAL PARAGRAPH TEXT - ONLY ITALICS APPLIED */}
    <p className="italic font-semibold font-sans text-base leading-snug tracking-normal">
      {quote}
    </p>
  </>
)}

  {/* EDITORIAL DESCRIPTION */}
{description && (
  <p className={`my-4 font-sans text-base font-normal leading-snug tracking-normal max-w-lg ${subTextClass}`}>
    {description}
  </p>
)}

      

      {/* FILM CONNECTIONS REPEATER */}
      {filmConnections.length > 0 && (
        <>
          {(description || quote) && <hr className={`w-full my-2 ${borderClass}`} />}
          <div className="flex flex-col gap-0">
            <span className={`text-sm capitalize font-sans tracking-normal font-medium ${mutedTextClass}`}>
              Related Films
            </span>
            <div className="flex flex-col gap-2">
              {filmConnections.map((movie, idx) => {
                const displayTitle = movie.name || 'Untitled Connection';
                
                // Seconds to minutes conversion
                let displayRuntime = '--';
                if (movie.runtime !== undefined && movie.runtime !== null) {
                  const rawSeconds = typeof movie.runtime === 'string' ? parseInt(movie.runtime, 10) : movie.runtime;
                  if (!isNaN(rawSeconds) && rawSeconds > 0) {
                    displayRuntime = `${Math.ceil(rawSeconds / 60).toString()}m`;
                  }
                }

                const internalSlug = movie.slug || movie.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '';

                return (
                  <div key={idx} className="flex items-baseline gap-2 py-0.5">
                    {internalSlug ? (
                      <Link href={`/film/${internalSlug}`} className="group cursor-pointer">
                        <span className="text-base font-semibold tracking-normal capitalize leading-normal font-sans cursor-pointer hover:underline decoration-1 underline-offset-4 block transition-all duration-200">
                          {displayTitle}
                        </span>
                      </Link>
                    ) : (
                      <span className="text-[14px] font-semibold tracking-tight capitalize leading-tight font-sans">
                        {displayTitle}
                      </span>
                    )}
                    <span className={`text-sm font-mono font-semibold whitespace-nowrap ${mutedTextClass}`}>
                      {displayRuntime}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* CALL TO ACTION BUTTON */}
      {linkCta && (
        <>
          {(description || quote || filmConnections.length > 0) && (
            <hr className={`w-full my-2 ${borderClass}`} />
          )}
          {/* 🎯 FIXED: Runs external destination string through formatting safety layer */}
          <a 
            href={formatExternalUrl(link)}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 text-sm font-medium font-sans tracking-normal capitalize hover:opacity-70 transition-opacity mt-0 group w-max cursor-pointer ${textClass}`}
          >
            <span>{linkCta}</span>
            <svg 
              className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform duration-200" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
        </>
      )}
    </div>
  );
}