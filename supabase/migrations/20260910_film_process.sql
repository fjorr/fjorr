-- Process images for film info (model sheets, sculpture, craft photos, frames…).
-- Not limited to film stills. Public read; writes via service_role (upload script).

create table if not exists public.film_process (
  id uuid primary key default gen_random_uuid(),
  film_id uuid not null references public.film (id) on delete cascade,
  url text not null,
  thumb_url text,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.film_process is
  'Process / craft images for film exhibition (sheets, sculpture, set, etc.). CDN under films/{slug}/process/.';

create index if not exists film_process_film_sort_idx
  on public.film_process (film_id, sort_order);

alter table public.film_process enable row level security;

drop policy if exists "Film process images are publicly readable" on public.film_process;
create policy "Film process images are publicly readable"
  on public.film_process
  for select
  to anon, authenticated
  using (true);

revoke all on public.film_process from public;
grant select on public.film_process to anon, authenticated;
grant all on public.film_process to service_role;

-- Drop earlier stills table if it was applied during prototyping.
drop table if exists public.film_still;
