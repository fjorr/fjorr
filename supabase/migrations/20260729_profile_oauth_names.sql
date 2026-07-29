-- Prefer OAuth / metadata names when creating profiles.
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
  meta_name := nullif(trim(coalesce(
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    ''
  )), '');

  base_slug := lower(
    regexp_replace(
      coalesce(
        nullif(meta_name, ''),
        split_part(coalesce(new.email, 'viewer'), '@', 1)
      ),
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
  meta jsonb;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into row from public.profiles where id = uid;
  if found then
    return row;
  end if;

  select u.email, u.raw_user_meta_data
    into email, meta
  from auth.users u
  where u.id = uid;

  meta_name := nullif(trim(coalesce(
    meta->>'display_name',
    meta->>'full_name',
    meta->>'name',
    ''
  )), '');

  base_slug := lower(
    regexp_replace(
      coalesce(
        nullif(meta_name, ''),
        split_part(coalesce(email, 'viewer'), '@', 1)
      ),
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
