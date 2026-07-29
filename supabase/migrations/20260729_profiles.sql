-- =============================================================================
-- Phase 0 — profiles (Scout identity)
-- Additive: auth.users remain source of truth; public.profiles holds membership.
-- =============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  slug text not null,
  bio text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    and char_length(slug) between 3 and 32
  )
);

create unique index if not exists profiles_slug_uidx on public.profiles (slug);

comment on table public.profiles is
  'Scout membership identity. Public read only when is_public = true.';

-- -----------------------------------------------------------------------------
-- updated_at
-- -----------------------------------------------------------------------------
create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_profiles_updated_at();

-- -----------------------------------------------------------------------------
-- Auto-create profile when a user signs up
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_slug text;
  final_slug text;
  n int := 0;
  meta_name text;
begin
  meta_name := nullif(trim(coalesce(new.raw_user_meta_data->>'display_name', '')), '');

  base_slug := lower(
    regexp_replace(
      split_part(coalesce(new.email, 'scout'), '@', 1),
      '[^a-z0-9]+',
      '-',
      'g'
    )
  );
  base_slug := trim(both '-' from base_slug);
  if base_slug is null or base_slug = '' or char_length(base_slug) < 3 then
    base_slug := 'scout';
  end if;
  if char_length(base_slug) > 24 then
    base_slug := left(base_slug, 24);
  end if;

  final_slug := base_slug;
  while exists (select 1 from public.profiles p where p.slug = final_slug) loop
    n := n + 1;
    final_slug := left(base_slug, 24) || '-' || n::text;
  end loop;

  insert into public.profiles (id, display_name, slug, is_public)
  values (
    new.id,
    coalesce(meta_name, split_part(coalesce(new.email, 'Scout'), '@', 1)),
    final_slug,
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Ensure profile for existing sessions (idempotent; call from app)
-- -----------------------------------------------------------------------------
create or replace function public.ensure_own_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  row public.profiles;
  base_slug text;
  final_slug text;
  n int := 0;
  email text;
  meta_name text;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into row from public.profiles where id = uid;
  if found then
    return row;
  end if;

  select u.email, nullif(trim(coalesce(u.raw_user_meta_data->>'display_name', '')), '')
    into email, meta_name
  from auth.users u
  where u.id = uid;

  base_slug := lower(
    regexp_replace(
      split_part(coalesce(email, 'scout'), '@', 1),
      '[^a-z0-9]+',
      '-',
      'g'
    )
  );
  base_slug := trim(both '-' from base_slug);
  if base_slug is null or base_slug = '' or char_length(base_slug) < 3 then
    base_slug := 'scout';
  end if;
  if char_length(base_slug) > 24 then
    base_slug := left(base_slug, 24);
  end if;

  final_slug := base_slug;
  while exists (select 1 from public.profiles p where p.slug = final_slug) loop
    n := n + 1;
    final_slug := left(base_slug, 24) || '-' || n::text;
  end loop;

  insert into public.profiles (id, display_name, slug, is_public)
  values (
    uid,
    coalesce(meta_name, split_part(coalesce(email, 'Scout'), '@', 1)),
    final_slug,
    false
  )
  on conflict (id) do update set updated_at = public.profiles.updated_at
  returning * into row;

  return row;
end;
$$;

grant execute on function public.ensure_own_profile() to authenticated;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "Profiles public read" on public.profiles;
create policy "Profiles public read"
  on public.profiles
  for select
  to anon, authenticated
  using (is_public = true or auth.uid() = id);

drop policy if exists "Profiles owner update" on public.profiles;
create policy "Profiles owner update"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Inserts happen via security-definer trigger / ensure_own_profile only.
drop policy if exists "Profiles owner insert" on public.profiles;
create policy "Profiles owner insert"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);
