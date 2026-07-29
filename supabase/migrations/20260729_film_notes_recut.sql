-- =============================================================================
-- Recut Engine — member film notes (private → Fjorr desk)
-- =============================================================================

create table if not exists public.film_notes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  film_id uuid not null references public.film (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  at_seconds integer check (at_seconds is null or at_seconds >= 0),
  status text not null default 'new'
    check (status in ('new', 'read', 'archived'))
);

create index if not exists film_notes_film_created_idx
  on public.film_notes (film_id, created_at desc);

create index if not exists film_notes_user_created_idx
  on public.film_notes (user_id, created_at desc);

create index if not exists film_notes_status_created_idx
  on public.film_notes (status, created_at desc);

create or replace function public.set_film_notes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists film_notes_set_updated_at on public.film_notes;
create trigger film_notes_set_updated_at
  before update on public.film_notes
  for each row execute function public.set_film_notes_updated_at();

comment on table public.film_notes is
  'Member craft notes on films (Recut Engine). Private — Fjorr desk only.';

alter table public.film_notes enable row level security;

drop policy if exists "Film notes owner insert" on public.film_notes;
drop policy if exists "Film notes owner read" on public.film_notes;

create policy "Film notes owner insert"
  on public.film_notes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Film notes owner read"
  on public.film_notes
  for select
  to authenticated
  using (auth.uid() = user_id);

revoke update, delete on public.film_notes from anon, authenticated;
grant select, insert on public.film_notes to authenticated;
revoke all on public.film_notes from anon;
