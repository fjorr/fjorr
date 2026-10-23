-- Square cutout for a film's Voyages poster. Unique per film.

alter table public.film
  add column if not exists voyage_poster text;
