'use client';

import dynamic from 'next/dynamic';

const FilmTranscript = dynamic(() => import('@/components/FilmTranscript'), {
  ssr: false,
  loading: () => (
    <div className="mt-2 h-10 w-40 rounded bg-white/5 animate-pulse" aria-hidden />
  ),
});

export default function FilmTranscriptLazy({
  subtitles,
  transcripts,
  filmSlug,
  onSeek,
  activeTime,
  variant,
}: {
  subtitles: Array<{ name: string; code: string; vtt_url?: string }>;
  transcripts: Array<{ language_code: string; content: string }>;
  filmSlug?: string;
  onSeek?: (seconds: number) => void;
  activeTime?: number | null;
  variant?: 'page' | 'dock';
}) {
  return (
    <FilmTranscript
      subtitles={subtitles}
      transcripts={transcripts}
      filmSlug={filmSlug}
      onSeek={onSeek}
      activeTime={activeTime}
      variant={variant}
    />
  );
}
