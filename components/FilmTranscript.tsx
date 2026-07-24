'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { parseLocale } from '@/i18n/config';
import { parseVttCues, type VttCue } from '@/lib/vtt';

interface TranscriptRow {
  language_code: string;
  content: string;
}

interface FilmTranscriptProps {
  subtitles: Array<{ name: string; code: string; vtt_url?: string }>;
  transcripts: TranscriptRow[];
  filmSlug?: string;
  /** Open theater / seek film to this cue start time. */
  onSeek?: (seconds: number) => void;
  /** Current playback time for follow-along highlight. */
  activeTime?: number | null;
  /** Tighter chrome for the in-theater dock. */
  variant?: 'page' | 'dock';
}

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[#76c3ff]/25 text-white rounded-[2px] px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function FilmTranscript({
  subtitles,
  transcripts,
  filmSlug,
  onSeek,
  activeTime = null,
  variant = 'page',
}: FilmTranscriptProps) {
  const t = useTranslations('Film');
  const locale = parseLocale(useLocale());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const activeRowRef = useRef<HTMLButtonElement | null>(null);

  const preferredCode = useMemo(() => {
    const codes = subtitles.map((s) => s.code.toLowerCase());
    if (codes.includes(locale)) return locale;
    if (codes.includes('en')) return 'en';
    return subtitles[0]?.code || '';
  }, [subtitles, locale]);

  const [isOpen, setIsOpen] = useState(variant === 'dock');
  const [activeLanguage, setActiveLanguage] = useState(preferredCode);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [fetchedVtt, setFetchedVtt] = useState('');
  const [vttLoading, setVttLoading] = useState(false);

  useEffect(() => {
    if (!activeLanguage && preferredCode) setActiveLanguage(preferredCode);
  }, [preferredCode, activeLanguage]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sourceVtt = useMemo(() => {
    if (!activeLanguage) return '';
    const row = transcripts.find(
      (item) => item.language_code.toLowerCase().trim() === activeLanguage.toLowerCase().trim()
    );
    if (row?.content) return row.content;
    const sub = subtitles.find(
      (item) => item.code.toLowerCase().trim() === activeLanguage.toLowerCase().trim()
    );
    return sub?.vtt_url || '';
  }, [transcripts, subtitles, activeLanguage]);

  useEffect(() => {
    let cancelled = false;
    setFetchedVtt('');

    const trimmed = sourceVtt.trim();
    if (!trimmed) return;

    const looksLikeUrl =
      trimmed.startsWith('http') || /\.vtt(\?|$)/i.test(trimmed);

    if (!looksLikeUrl) {
      setFetchedVtt(trimmed);
      return;
    }

    setVttLoading(true);
    fetch(trimmed)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.text();
      })
      .then((text) => {
        if (!cancelled) setFetchedVtt(text);
      })
      .catch(() => {
        if (!cancelled) setFetchedVtt('');
      })
      .finally(() => {
        if (!cancelled) setVttLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sourceVtt]);

  const rawVtt = fetchedVtt;
  const cues = useMemo(() => parseVttCues(rawVtt), [rawVtt]);

  const filteredCues = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cues;
    return cues.filter((cue) => cue.dialogue.toLowerCase().includes(q));
  }, [cues, query]);

  const activeCueIndex = useMemo(() => {
    if (activeTime == null || !Number.isFinite(activeTime)) return -1;
    return cues.findIndex(
      (cue) => activeTime >= cue.startSeconds && activeTime <= cue.endSeconds
    );
  }, [cues, activeTime]);

  useEffect(() => {
    if (activeCueIndex < 0 || query.trim()) return;
    activeRowRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeCueIndex, query]);

  const languageLabel =
    subtitles.find((s) => s.code === activeLanguage)?.name ||
    activeLanguage.toUpperCase();

  const openWithLanguage = (code: string) => {
    setActiveLanguage(code);
    setIsOpen(true);
    setIsDropdownOpen(false);
  };

  const handlePrimaryClick = () => {
    if (!isOpen) {
      openWithLanguage(activeLanguage || preferredCode);
      return;
    }
    if (subtitles.length <= 1) return;
    setIsDropdownOpen((v) => !v);
  };

  const shareUrlForCue = (cue: VttCue) => {
    if (typeof window === 'undefined' || !filmSlug) return '';
    const url = new URL(`/film/${filmSlug}`, window.location.origin);
    url.searchParams.set('t', String(Math.floor(cue.startSeconds)));
    return url.toString();
  };

  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(key);
      window.setTimeout(() => setCopiedId(null), 1400);
    } catch {
      // ignore
    }
  };

  const downloadVtt = () => {
    if (!rawVtt.trim()) return;
    const blob = new Blob([rawVtt], { type: 'text/vtt;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = `${filmSlug || 'film'}-${activeLanguage || 'transcript'}.vtt`;
    a.click();
    URL.revokeObjectURL(href);
  };

  const isDock = variant === 'dock';

  return (
    <div className={`w-full ${isDock ? 'h-full flex flex-col min-h-0' : ''}`}>
      <div className={`flex items-center gap-2 flex-wrap ${isDock ? 'shrink-0' : ''}`}>
        <div className="relative inline-block" ref={dropdownRef}>
          <button
            type="button"
            onClick={handlePrimaryClick}
            className={`h-9 px-4 inline-flex items-center justify-center gap-2 rounded-[8px] text-sm font-semibold tracking-normal transition-all duration-150 select-none active:scale-[0.98] ${
              isOpen ? 'text-white bg-white/10' : 'text-white/60 bg-white/5 hover:bg-white/10'
            }`}
          >
            <svg
              className={`w-5 h-5 shrink-0 ${isOpen ? 'text-[#76c3ff]' : 'text-white/60'}`}
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
              {isOpen ? languageLabel : t('transcript')}
            </span>
            {subtitles.length > 1 && (
              <svg className="w-3.5 h-3.5 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
              </svg>
            )}
          </button>

          {isDropdownOpen && subtitles.length > 0 && (
            <div className="absolute left-0 mt-2 w-48 bg-[#2a2a2a] rounded-[8px] shadow-2xl overflow-hidden z-50 px-1 py-1">
              {subtitles.map((sub) => (
                <button
                  key={sub.code}
                  type="button"
                  onClick={() => openWithLanguage(sub.code)}
                  className={`w-full text-left px-5 py-2.5 text-sm font-sans font-semibold tracking-normal transition-colors rounded-[6px] hover:bg-white/5 ${
                    isOpen && activeLanguage === sub.code
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

        {isOpen && rawVtt.trim() && (
          <button
            type="button"
            onClick={downloadVtt}
            className="h-9 px-3 rounded-[8px] bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 text-sm font-semibold transition-colors"
          >
            {t('transcriptDownload')}
          </button>
        )}

        {!isDock && (
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setIsDropdownOpen(false);
              setQuery('');
            }}
            aria-label={t('transcriptClose')}
            className={`h-9 w-9 inline-flex items-center justify-center rounded-[8px] bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all duration-200 select-none active:scale-[0.95] ${
              isOpen
                ? 'opacity-100 scale-100 pointer-events-auto'
                : 'opacity-0 scale-95 pointer-events-none'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && (
        <div
          className={`w-full mt-4 flex flex-col min-h-0 ${
            isDock ? 'flex-1' : 'max-w-3xl'
          }`}
        >
          <div className="relative mb-3 shrink-0">
            <svg
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/35 pointer-events-none"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('transcriptSearch')}
              className="w-full h-10 rounded-[8px] bg-white/5 pl-10 pr-3 font-sans text-sm font-medium text-white placeholder-white/40 focus:outline-none focus:bg-white/10"
            />
          </div>

          <div
            ref={listRef}
            className={`w-full space-y-1 font-sans ${
              isDock ? 'flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1' : ''
            }`}
          >
            {vttLoading ? (
              <div className="text-white/35 text-[13px] py-4 px-1 animate-pulse">
                …
              </div>
            ) : filteredCues.length > 0 ? (
              filteredCues.map((cue) => {
                const absoluteIndex = cues.indexOf(cue);
                const isActive = absoluteIndex === activeCueIndex;
                const copyKey = `copy-${absoluteIndex}`;
                const shareKey = `share-${absoluteIndex}`;

                return (
                  <div
                    key={`${cue.startSeconds}-${absoluteIndex}`}
                    className={`group flex items-start gap-2 rounded-[8px] px-2 py-2 transition-colors ${
                      isActive ? 'bg-white/10' : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <button
                      ref={isActive ? activeRowRef : undefined}
                      type="button"
                      onClick={() => onSeek?.(cue.startSeconds)}
                      className="flex items-start gap-3 flex-1 min-w-0 text-left"
                      title={onSeek ? t('transcriptPlayFrom') : undefined}
                    >
                      <span
                        className={`font-mono font-medium text-sm tracking-normal select-none w-10 shrink-0 pt-0.5 ${
                          isActive ? 'text-[#76c3ff]' : 'text-[#76c3ff]/80'
                        }`}
                      >
                        {cue.displayTime}
                      </span>
                      <span className="text-white/80 font-medium text-[15px] leading-snug">
                        {highlightMatch(cue.dialogue, query)}
                      </span>
                    </button>

                    <div className="shrink-0 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => copyText(copyKey, cue.dialogue)}
                        className="h-7 px-2 rounded-[6px] text-[11px] font-semibold text-white/45 hover:text-white/80 hover:bg-white/10"
                        title={t('transcriptCopy')}
                      >
                        {copiedId === copyKey ? t('transcriptCopied') : t('transcriptCopy')}
                      </button>
                      {filmSlug && (
                        <button
                          type="button"
                          onClick={() => copyText(shareKey, shareUrlForCue(cue))}
                          className="h-7 px-2 rounded-[6px] text-[11px] font-semibold text-white/45 hover:text-white/80 hover:bg-white/10"
                          title={t('transcriptShare')}
                        >
                          {copiedId === shareKey ? t('transcriptCopied') : t('transcriptShare')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-white/35 text-[13px] py-4 px-1">
                {query.trim() ? t('transcriptNoMatches') : t('transcriptUnavailable')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
