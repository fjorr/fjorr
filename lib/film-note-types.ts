export type FilmNoteStatus = 'new' | 'read' | 'archived';

export type FilmNoteRow = {
  id: string;
  created_at: string;
  film_id: string;
  film_name: string | null;
  film_slug: string | null;
  body: string;
  at_seconds: number | null;
  status: FilmNoteStatus;
  /** Cut the note was filed against (v1, v2…). */
  film_version: number;
  /** Playback id for the cut (Mux frame-at-TC thumbs). */
  mux_playback_id: string | null;
  /** Precomputed Mux still for ledger rows. */
  frame_url: string | null;
  /** Larger still for expanded detail. */
  frame_url_lg: string | null;
};
