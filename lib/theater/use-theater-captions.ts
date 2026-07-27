'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { VttCue } from '@/lib/vtt';
import { advanceActiveCueIndex } from '@/lib/vtt';
import { loadVttCues } from '@/lib/theater/vtt-cache';

export type TheaterSubTrack = {
  code: string;
  name: string;
  vtt_url: string;
};

type Args = {
  tracks: TheaterSubTrack[];
  locale: string;
  /** Prefer locale track when theater opens (after bumper). */
  enableAutoSelect: boolean;
  currentTimeRef: React.MutableRefObject<number>;
  isPlayingRef: React.MutableRefObject<boolean>;
};

export function useTheaterCaptions({
  tracks,
  locale,
  enableAutoSelect,
  currentTimeRef,
  isPlayingRef,
}: Args) {
  const [selectedLangCode, setSelectedLangCode] = useState<string>('none');
  const [currentSubtitleText, setCurrentSubtitleText] = useState('');
  const [showCCMenu, setShowCCMenu] = useState(false);
  const cuesRef = useRef<VttCue[]>([]);
  const cueIndexRef = useRef(-1);
  const lastTextRef = useRef('');

  const clearCaptions = useCallback(() => {
    cuesRef.current = [];
    cueIndexRef.current = -1;
    lastTextRef.current = '';
    setCurrentSubtitleText('');
    setSelectedLangCode('none');
  }, []);

  const selectLanguage = useCallback(async (langCode: string) => {
    setSelectedLangCode(langCode);
    setShowCCMenu(false);

    if (langCode === 'none') {
      cuesRef.current = [];
      cueIndexRef.current = -1;
      lastTextRef.current = '';
      setCurrentSubtitleText('');
      return;
    }

    const match = tracks.find(
      (item) => (item.code || '').toLowerCase().trim() === langCode.toLowerCase().trim()
    );
    if (!match?.vtt_url) {
      cuesRef.current = [];
      cueIndexRef.current = -1;
      lastTextRef.current = '';
      setCurrentSubtitleText('');
      return;
    }

    try {
      const cues = await loadVttCues(langCode, match.vtt_url);
      cuesRef.current = cues;
      cueIndexRef.current = -1;
      const { cue } = advanceActiveCueIndex(cues, currentTimeRef.current, -1);
      const text = cue?.dialogue || '';
      lastTextRef.current = text;
      setCurrentSubtitleText(text);
    } catch (err) {
      console.error('VTT load failed:', err);
      cuesRef.current = [];
      setCurrentSubtitleText('');
    }
  }, [tracks, currentTimeRef]);

  // Auto-select site locale when tracks arrive / bumper ends.
  useEffect(() => {
    if (!enableAutoSelect) return;
    const hasLocale = tracks.some(
      (t) => (t.code || '').toLowerCase().trim() === locale
    );
    const preferred = locale !== 'en' && hasLocale ? locale : 'none';
    if (preferred === 'none') {
      clearCaptions();
      return;
    }
    void selectLanguage(preferred);
  }, [enableAutoSelect, locale, tracks, clearCaptions, selectLanguage]);

  /** Call from the theater rAF loop — only setStates when cue text changes. */
  const syncCueToTime = useCallback(() => {
    if (selectedLangCode === 'none' || cuesRef.current.length === 0) {
      if (lastTextRef.current) {
        lastTextRef.current = '';
        setCurrentSubtitleText('');
      }
      return;
    }
    const { index, cue } = advanceActiveCueIndex(
      cuesRef.current,
      currentTimeRef.current,
      cueIndexRef.current
    );
    cueIndexRef.current = index;
    const text = cue?.dialogue || '';
    if (text !== lastTextRef.current) {
      lastTextRef.current = text;
      setCurrentSubtitleText(text);
    }
  }, [selectedLangCode, currentTimeRef]);

  // Keep cue fresh while paused/scrubbing via a light interval when not playing.
  useEffect(() => {
    if (selectedLangCode === 'none') return;
    const id = window.setInterval(() => {
      if (!isPlayingRef.current) syncCueToTime();
    }, 250);
    return () => clearInterval(id);
  }, [selectedLangCode, syncCueToTime, isPlayingRef]);

  return {
    selectedLangCode,
    currentSubtitleText,
    showCCMenu,
    setShowCCMenu,
    selectLanguage,
    syncCueToTime,
    clearCaptions,
  };
}
