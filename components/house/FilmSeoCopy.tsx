import React from 'react';

type FilmSeoCopyProps = {
  name: string;
  teaser?: string | null;
  description?: string | null;
  note?: string | null;
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
  note,
  directorNote,
  transcriptText,
  directorName,
}: FilmSeoCopyProps) {
  const body = description || note || null;
  const hasTranscript = Boolean(transcriptText?.trim());

  return (
    <article className="sr-only" aria-label={`${name} — film details`}>
      <h1>{name}</h1>
      {teaser ? <p>{teaser}</p> : null}
      {body ? (
        <section>
          <h2>About</h2>
          <p>{body}</p>
        </section>
      ) : null}
      {directorNote ? (
        <section>
          <h2>Director notes{directorName ? ` — ${directorName}` : ''}</h2>
          <p>{directorNote}</p>
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
