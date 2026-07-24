'use client';

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
  isLoader?: boolean; 
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
  isLoader = false, 
}: ArtifactSidebarProps) {
  
  const formatExternalUrl = (url: string | null | undefined): string => {
    if (!url) return '#';
    const trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  // 🎯 HIGH-FIDELITY SIDEBAR WIREFRAME SKELETON
  if (isLoader) {
    const wireframeContentColor = isDarkBg ? 'bg-white/5' : 'bg-black/5';
    const wireframeTitleColor = isDarkBg ? 'bg-white/10' : 'bg-black/10';

    return (
      <div 
        style={{ backgroundColor: customBg }}
        className="w-full lg:w-[400px] shrink-0 flex flex-col justify-start p-8 md:p-10 lg:pt-[110px] h-full border-none !border-0 select-none"
      >
        <div className="animate-pulse flex flex-col gap-4 w-full">
          <div className={`w-24 h-3 ${wireframeContentColor} rounded`} />
          <div className={`w-56 h-8 ${wireframeTitleColor} rounded-lg`} />
          
          <div className="flex flex-col gap-1.5 mt-2">
            <div className={`w-36 h-4 ${wireframeContentColor} rounded`} />
            <div className={`w-28 h-4 ${wireframeContentColor} rounded`} />
          </div>

          <div className={`w-full h-24 ${wireframeContentColor} rounded-xl mt-6`} />
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{ backgroundColor: customBg }}
      className={`w-full lg:w-[400px] shrink-0 flex flex-col justify-start p-8 md:p-10 lg:pt-[110px] h-full ${textClass} border-none !border-0`}
    >
      <span className={`text-[11px] capitalize font-mono tracking-normal font-bold mb-2 ${mutedTextClass}`}>
        Film Artifact
      </span>

      <h1 className={`font-sans text-2xl capitalize tracking-tighter leading-none font-black mb-4 ${textClass}`}>
        {name}
      </h1>

      {/* 🎯 METADATA CONTAINER STACKED BLOCK */}
      <div className="flex flex-col items-start gap-y-0.5 mb-5">
        
        {/* Creator Name: Now rendered using full textClass brightness, bold weight, and a distinct bottom margin */}
        {creatorName && (
          <span className={`font-sans text-sm font-medium tracking-normal capitalize leading-tight mb-01 ${textClass}`}>
            {creatorName}
          </span>
        )}

        {/* Supporting Meta Tokens: Keeps the elegant, low-opacity text blend styling */}
        {label && (
          <span className={`font-sans text-sm font-medium leading-tight capitalize ${subTextClass}`}>
            {label}
          </span>
        )}
        
        {releaseYear && (
          <span className={`font-sans text-sm font-medium leading-tight capitalize ${subTextClass}`}>
            {releaseYear}
          </span>
        )}
      </div>

      {quote && (
        <div className="pt-2">
          <p className={`italic font-semibold font-sans text-base leading-snug tracking-normal mb-4 ${textClass}`}>
            {quote}
          </p>
        </div>
      )}

      {description && (
        <p className={`my-2 font-sans text-base font-normal leading-snug tracking-normal max-w-lg ${subTextClass}`}>
          {description}
        </p>
      )}

      {filmConnections.length > 0 && (
        <div className="pt-4 flex flex-col gap-0">
          <span className={`text-sm capitalize font-sans tracking-normal font-medium ${mutedTextClass}`}>
            Related Films
          </span>
          <div className="flex flex-col gap-2 mt-1">
            {filmConnections.map((movie, idx) => {
              const displayTitle = movie.name || 'Untitled Connection';
              
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
                      <span className={`text-base font-semibold tracking-normal capitalize leading-normal font-sans cursor-pointer hover:underline decoration-1 underline-offset-4 block transition-all duration-200 ${textClass}`}>
                        {displayTitle}
                      </span>
                    </Link>
                  ) : (
                    <span className={`text-[14px] font-semibold tracking-tight capitalize leading-tight font-sans ${textClass}`}>
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
      )}

      {linkCta && (
        <div className="pt-4">
          <a 
            href={formatExternalUrl(link)}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 text-sm font-medium font-sans tracking-normal capitalize hover:opacity-70 transition-opacity mt-2 group w-max cursor-pointer ${textClass}`}
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
        </div>
      )}
    </div>
  );
}