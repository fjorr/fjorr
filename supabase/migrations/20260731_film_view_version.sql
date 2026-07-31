-- =============================================================================
-- Film versioning (Plus Machine)
-- Cuts are rows. Voyageur stamps the cut watched. film.mux_playback_id stays
-- in sync with the live cut so existing players keep working.
-- =============================================================================

-- 1) Cuts -------------------------------------------------------------------

create table if not exists public.film_version (
  id uuid primary key default gen_random_uuid(),
  film_id uuid not null references public.film (id) on delete cascade,
  version integer not null check (version >= 1),
  mux_playback_id text,
  runtime integer,
  changelog text,
  status text not null default 'archived'
    check (status in ('live', 'archived')),
  shipped_at timestamptz not null default now(),
  shipped_by uuid references auth.users (id) on delete set null,
  source_note_id uuid references public.film_notes (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (film_id, version)
);

create index if not exists film_version_film_id_idx
  on public.film_version (film_id, version desc);

-- At most one live cut per film
create unique index if not exists film_version_one_live_per_film
  on public.film_version (film_id)
  where status = 'live';

comment on table public.film_version is
  'A shipped cut of a film. v1 is the first air; later rows are Plus patches.';
comment on column public.film_version.changelog is
  'What changed in this cut — short, human.';
comment on column public.film_version.status is
  'live = current playable cut; archived = prior cut kept for history.';

alter table public.film_version enable row level security;

drop policy if exists "Film versions are publicly readable" on public.film_version;
create policy "Film versions are publicly readable"
  on public.film_version
  for select
  to anon, authenticated
  using (true);

revoke insert, update, delete on public.film_version from anon, authenticated;
grant select on public.film_version to anon, authenticated;

-- 2) Seed v1 from current film rows ----------------------------------------

insert into public.film_version (
  film_id,
  version,
  mux_playback_id,
  runtime,
  changelog,
  status,
  shipped_at
)
select
  f.id,
  1,
  f.mux_playback_id,
  f.runtime,
  'Initial cut.',
  'live',
  coalesce(f.release_date::timestamptz, now())
from public.film f
where not exists (
  select 1 from public.film_version fv where fv.film_id = f.id
);

-- 3) Point film at its live cut --------------------------------------------

alter table public.film
  add column if not exists version integer not null default 1;

alter table public.film
  add column if not exists current_version_id uuid;

-- Backfill current_version_id + denormalized version number
update public.film f
set
  current_version_id = fv.id,
  version = fv.version
from public.film_version fv
where fv.film_id = f.id
  and fv.status = 'live';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'film_current_version_id_fkey'
  ) then
    alter table public.film
      add constraint film_current_version_id_fkey
      foreign key (current_version_id)
      references public.film_version (id)
      on delete set null;
  end if;
end $$;

comment on column public.film.version is
  'Denormalized live cut number (mirrors film_version.version where status=live).';
comment on column public.film.current_version_id is
  'FK to the live film_version row.';

-- Keep film.mux_playback_id / runtime / version aligned with live cut
create or replace function public.sync_film_from_current_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cut public.film_version;
begin
  if new.current_version_id is null then
    return new;
  end if;

  select * into cut from public.film_version where id = new.current_version_id;
  if not found then
    return new;
  end if;

  if cut.film_id <> new.id then
    raise exception 'current_version_id must belong to this film';
  end if;

  new.version := cut.version;
  new.mux_playback_id := cut.mux_playback_id;
  if cut.runtime is not null then
    new.runtime := cut.runtime;
  end if;
  return new;
end;
$$;

drop trigger if exists film_sync_current_version on public.film;
create trigger film_sync_current_version
  before insert or update of current_version_id
  on public.film
  for each row
  execute function public.sync_film_from_current_version();

-- 4) Stamp the cut on Film Log / Voyageur ----------------------------------

alter table public.film_view_record
  add column if not exists film_version integer not null default 1
  check (film_version >= 1);

alter table public.film_view_record
  add column if not exists film_version_id uuid;

-- Backfill stamps → live cut at time of migration (best available history)
update public.film_view_record r
set
  film_version_id = f.current_version_id,
  film_version = coalesce(f.version, 1)
from public.film f
where f.id = r.film_id
  and r.film_version_id is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'film_view_record_film_version_id_fkey'
  ) then
    alter table public.film_view_record
      add constraint film_view_record_film_version_id_fkey
      foreign key (film_version_id)
      references public.film_version (id)
      on delete set null;
  end if;
end $$;

comment on column public.film_view_record.film_version is
  'Denormalized cut number at first log. Frozen.';
comment on column public.film_view_record.film_version_id is
  'FK to the film_version row this member watched. Frozen.';

create index if not exists film_view_record_version_id_idx
  on public.film_view_record (film_version_id);

-- 5) record_film_view stamps live cut --------------------------------------

drop function if exists public.record_film_view(uuid);

create or replace function public.record_film_view(p_film_id uuid)
returns table (
  viewer_number bigint,
  recorded boolean,
  user_id uuid,
  film_version integer,
  film_version_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  existing public.film_view_record;
  assigned bigint;
  live_id uuid;
  live_n integer;
begin
  if p_film_id is null then
    raise exception 'film_id required';
  end if;

  select f.current_version_id, f.version
  into live_id, live_n
  from public.film f
  where f.id = p_film_id;

  if not found then
    raise exception 'Unknown film';
  end if;

  -- Ensure every film has a live cut (safety for rows created outside seed)
  if live_id is null then
    insert into public.film_version (
      film_id, version, mux_playback_id, runtime, changelog, status
    )
    select f.id, 1, f.mux_playback_id, f.runtime, 'Initial cut.', 'live'
    from public.film f
    where f.id = p_film_id
    returning id, version into live_id, live_n;

    update public.film
    set current_version_id = live_id, version = live_n
    where id = p_film_id;
  end if;

  if uid is not null then
    select * into existing
    from public.film_view_record r
    where r.user_id = uid and r.film_id = p_film_id;

    if found then
      viewer_number := existing.viewer_number;
      recorded := true;
      user_id := existing.user_id;
      film_version := existing.film_version;
      film_version_id := existing.film_version_id;
      return next;
      return;
    end if;
  end if;

  insert into public.film_view_counter (film_id, next_viewer)
  values (p_film_id, 1)
  on conflict (film_id) do nothing;

  update public.film_view_counter c
  set next_viewer = c.next_viewer + 1
  where c.film_id = p_film_id
  returning c.next_viewer - 1 into assigned;

  if uid is not null then
    insert into public.film_view_record (
      user_id, film_id, viewer_number, film_version, film_version_id
    )
    values (uid, p_film_id, assigned, live_n, live_id)
    on conflict (user_id, film_id) do nothing
    returning * into existing;

    if existing is null then
      select * into existing
      from public.film_view_record r
      where r.user_id = uid and r.film_id = p_film_id;
    end if;

    viewer_number := existing.viewer_number;
    recorded := true;
    user_id := existing.user_id;
    film_version := existing.film_version;
    film_version_id := existing.film_version_id;
    return next;
    return;
  end if;

  viewer_number := assigned;
  recorded := false;
  user_id := null;
  film_version := live_n;
  film_version_id := live_id;
  return next;
end;
$$;

comment on function public.record_film_view(uuid) is
  'Allocate Viewer #. Signed-in members write a Film Log stamped with the live film_version.';

grant execute on function public.record_film_view(uuid) to anon, authenticated;

-- 6) Ship a Plus cut (admin / service role) ---------------------------------

create or replace function public.ship_film_version(
  p_film_id uuid,
  p_mux_playback_id text,
  p_changelog text default null,
  p_runtime integer default null,
  p_source_note_id uuid default null,
  p_shipped_by uuid default null
)
returns public.film_version
language plpgsql
security definer
set search_path = public
as $$
declare
  next_n integer;
  cut public.film_version;
begin
  if p_film_id is null then
    raise exception 'film_id required';
  end if;
  if p_mux_playback_id is null or length(trim(p_mux_playback_id)) = 0 then
    raise exception 'mux_playback_id required';
  end if;
  if not exists (select 1 from public.film where id = p_film_id) then
    raise exception 'Unknown film';
  end if;

  select coalesce(max(version), 0) + 1
  into next_n
  from public.film_version
  where film_id = p_film_id;

  update public.film_version
  set status = 'archived'
  where film_id = p_film_id
    and status = 'live';

  insert into public.film_version (
    film_id,
    version,
    mux_playback_id,
    runtime,
    changelog,
    status,
    shipped_by,
    source_note_id
  )
  values (
    p_film_id,
    next_n,
    trim(p_mux_playback_id),
    p_runtime,
    nullif(trim(coalesce(p_changelog, '')), ''),
    'live',
    p_shipped_by,
    p_source_note_id
  )
  returning * into cut;

  update public.film
  set current_version_id = cut.id
  where id = p_film_id;

  return cut;
end;
$$;

comment on function public.ship_film_version(uuid, text, text, integer, uuid, uuid) is
  'Archive the live cut, insert the next version as live, sync film.mux_playback_id.';

revoke all on function public.ship_film_version(uuid, text, text, integer, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.ship_film_version(uuid, text, text, integer, uuid, uuid)
  to service_role;
