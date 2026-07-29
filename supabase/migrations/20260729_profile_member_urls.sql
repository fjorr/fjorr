-- =============================================================================
-- Profile URLs: /account/{member_number}/{slug}
-- member_number is the stable identity; slug is non-unique label.
-- =============================================================================

-- Sequence for permanent member numbers (Viewer #N substrate)
create sequence if not exists public.profiles_member_number_seq;

alter table public.profiles
  add column if not exists member_number bigint;

-- Backfill existing rows in join order
with ordered as (
  select id, row_number() over (order by created_at asc, id asc) as n
  from public.profiles
  where member_number is null
)
update public.profiles p
set member_number = ordered.n
from ordered
where p.id = ordered.id;

-- Advance sequence past any assigned numbers (next nextval = max + 1)
select setval(
  'public.profiles_member_number_seq',
  coalesce((select max(member_number) from public.profiles), 0)
);

alter table public.profiles
  alter column member_number set default nextval('public.profiles_member_number_seq'),
  alter column member_number set not null;

create unique index if not exists profiles_member_number_uidx
  on public.profiles (member_number);

-- Slug is no longer globally unique (many members can share "thor")
drop index if exists public.profiles_slug_uidx;

comment on column public.profiles.member_number is
  'Permanent member number. Public path: /account/{member_number}/{slug}.';
comment on column public.profiles.slug is
  'URL label under member number. Not unique; routing keys off member_number.';

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
  meta_name text;
begin
  meta_name := nullif(trim(coalesce(new.raw_user_meta_data->>'display_name', '')), '');

  base_slug := lower(
    regexp_replace(
      split_part(coalesce(new.email, 'viewer'), '@', 1),
      '[^a-z0-9]+',
      '-',
      'g'
    )
  );
  base_slug := trim(both '-' from base_slug);
  if base_slug is null or base_slug = '' or char_length(base_slug) < 3 then
    base_slug := 'viewer';
  end if;
  if char_length(base_slug) > 32 then
    base_slug := left(base_slug, 32);
  end if;

  insert into public.profiles (id, display_name, slug, is_public)
  values (
    new.id,
    coalesce(meta_name, split_part(coalesce(new.email, 'Viewer'), '@', 1)),
    base_slug,
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Ensure profile for existing sessions
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
      split_part(coalesce(email, 'viewer'), '@', 1),
      '[^a-z0-9]+',
      '-',
      'g'
    )
  );
  base_slug := trim(both '-' from base_slug);
  if base_slug is null or base_slug = '' or char_length(base_slug) < 3 then
    base_slug := 'viewer';
  end if;
  if char_length(base_slug) > 32 then
    base_slug := left(base_slug, 32);
  end if;

  insert into public.profiles (id, display_name, slug, is_public)
  values (
    uid,
    coalesce(meta_name, split_part(coalesce(email, 'Viewer'), '@', 1)),
    base_slug,
    false
  )
  on conflict (id) do update set updated_at = public.profiles.updated_at
  returning * into row;

  return row;
end;
$$;

grant execute on function public.ensure_own_profile() to authenticated;
