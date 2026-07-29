-- Director's note — editorial prose on the film page (not player chrome).
-- English on public.film; other locales on film_translation when present.

alter table public.film
  add column if not exists director_note text;

alter table public.film_translation
  add column if not exists director_note text;

comment on column public.film.director_note is
  'Director''s note — shown on the film page under the story blurb.';
