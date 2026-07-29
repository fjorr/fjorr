-- =============================================================================
-- Phase 1 — Patron Stamps (watch ledger)
-- One stamp per member per film. viewer_number = Nth unique signed-in viewer.
-- =============================================================================

create table if not exists public.film_view_counter (
  film_id uuid primary key references public.film (id) on delete cascade,
  next_viewer bigint not null default 1
    check (next_viewer >= 1)
);

create table if not exists public.film_view_stamp (
  user_id uuid not null references auth.users (id) on delete cascade,
  film_id uuid not null references public.film (id) on delete cascade,
  viewer_number bigint not null check (viewer_number >= 1),
  stamped_at timestamptz not null default now(),
  primary key (user_id, film_id)
);

create index if not exists film_view_stamp_user_stamped_idx
  on public.film_view_stamp (user_id, stamped_at desc);

create index if not exists film_view_stamp_film_viewer_idx
  on public.film_view_stamp (film_id, viewer_number);

comment on table public.film_view_stamp is
  'Patron stamp: signed-in watch ledger. viewer_number is per-film ordinal.';

-- -----------------------------------------------------------------------------
-- Idempotent stamp: returns existing or newly assigned row
-- -----------------------------------------------------------------------------
create or replace function public.stamp_film_view(p_film_id uuid)
returns public.film_view_stamp
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  existing public.film_view_stamp;
  assigned bigint;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_film_id is null then
    raise exception 'film_id required';
  end if;

  if not exists (select 1 from public.film f where f.id = p_film_id) then
    raise exception 'Unknown film';
  end if;

  select * into existing
  from public.film_view_stamp
  where user_id = uid and film_id = p_film_id;

  if found then
    return existing;
  end if;

  insert into public.film_view_counter (film_id, next_viewer)
  values (p_film_id, 1)
  on conflict (film_id) do nothing;

  update public.film_view_counter
  set next_viewer = next_viewer + 1
  where film_id = p_film_id
  returning next_viewer - 1 into assigned;

  insert into public.film_view_stamp (user_id, film_id, viewer_number)
  values (uid, p_film_id, assigned)
  on conflict (user_id, film_id) do nothing
  returning * into existing;

  if existing is null then
    select * into existing
    from public.film_view_stamp
    where user_id = uid and film_id = p_film_id;
  end if;

  return existing;
end;
$$;

grant execute on function public.stamp_film_view(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.film_view_stamp enable row level security;
alter table public.film_view_counter enable row level security;

drop policy if exists "Stamps owner read" on public.film_view_stamp;
create policy "Stamps owner read"
  on public.film_view_stamp
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Public profiles expose their stamps (Passport / dossier)
drop policy if exists "Stamps public profile read" on public.film_view_stamp;
create policy "Stamps public profile read"
  on public.film_view_stamp
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = film_view_stamp.user_id
        and p.is_public = true
    )
  );

-- Writes only via security-definer RPC
revoke insert, update, delete on public.film_view_stamp from anon, authenticated;
revoke all on public.film_view_counter from anon, authenticated;

grant select on public.film_view_stamp to anon, authenticated;
