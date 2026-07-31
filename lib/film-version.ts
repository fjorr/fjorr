/**
 * Film versioning — Plus Machine cuts.
 * Live cut is film.current_version_id; prior cuts stay archived.
 */

export type FilmVersionStatus = 'live' | 'archived';

export type FilmVersion = {
  id: string;
  film_id: string;
  version: number;
  mux_playback_id: string | null;
  runtime: number | null;
  changelog: string | null;
  status: FilmVersionStatus;
  shipped_at: string;
  shipped_by: string | null;
  source_note_id: string | null;
};

export function formatFilmVersionLabel(version: number): string {
  return `v${Math.max(1, Math.floor(version))}`;
}
