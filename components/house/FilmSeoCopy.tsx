import React from 'react';
import FilmCopy from '@/components/house/FilmCopy';

type FilmSeoCopyProps = {
  name: string;
  teaser?: string | null;
  description?: string | null;
  directorNote?: string | null;
  transcriptText?: string | null;
  directorName?: string | null;
};

/**
 * Server-rendered copy for search engines and assistive tech.
 * Mirrors Info-sheet content; house stage remains the visual primary.
 */
export default function FilmSeoCopy({
  name,
  teaser,
  description,
  directorNote,
  transcriptText,
  directorName,
}: FilmSeoCopyProps) {
  const body = description || null;
  const hasTranscript = Boolean(transcriptText?.trim());

  return (
    <article className="sr-only" aria-label={`${name} — film details`}>
      <h1>{name}</h1>
      {teaser ? <p>{teaser}</p> : null}
      {body ? (
        <section>
          <h2>About</h2>
          <FilmCopy text={body} />
        </section>
      ) : null}
      {directorNote ? (
        <section>
          <h2>Director’s note{directorName ? ` — ${directorName}` : ''}</h2>
          <FilmCopy text={directorNote} />
        </section>
      ) : null}
      {hasTranscript ? (
        <section>
          <h2>Transcript</h2>
          <pre>{transcriptText}</pre>
        </section>
      ) : null}
    </article>
  );
}
