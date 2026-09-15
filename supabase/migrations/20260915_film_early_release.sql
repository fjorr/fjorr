-- Early release — Bureaux premieres before public release_date.
-- Apply: supabase --experimental db query --workdir /Users/thor/code/fjorr --linked -f supabase/migrations/20260915_film_early_release.sql

alter table public.film
  add column if not exists early_release boolean not null default false;

comment on column public.film.early_release is
  'When true, Bureaux members can watch before public release.';

create index if not exists film_early_release_idx
  on public.film (early_release, release_date)
  where early_release = true;
