-- Voyage trail privacy — members can opt out of lineage.
-- Default on. Opt-out: no via attribution in or out; display redacts identity.

alter table public.profiles
  add column if not exists voyage_lineage_enabled boolean not null default true;

comment on column public.profiles.voyage_lineage_enabled is
  'When false, share links omit via; Voyages stamp without referrer; identity redacted as passer.';

drop function if exists public.record_film_view(uuid);
drop function if exists public.record_film_view(uuid, integer);

create or replace function public.record_film_view(
  p_film_id uuid,
  p_referred_by_member_number integer default null
)
returns table (
  viewer_number bigint,
  recorded boolean,
  user_id uuid,
  film_version integer,
  film_version_id uuid,
  referred_by_user_id uuid,
  referred_by_member_number integer
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
  referrer uuid := null;
  referrer_n integer := null;
  viewer_lineage boolean := true;
  referrer_lineage boolean := true;
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

  -- Viewer opted out → never accept a referrer
  if uid is not null then
    select coalesce(p.voyage_lineage_enabled, true)
    into viewer_lineage
    from public.profiles p
    where p.id = uid;

    if not found then
      viewer_lineage := true;
    end if;
  end if;

  if viewer_lineage
     and p_referred_by_member_number is not null
     and p_referred_by_member_number > 0 then
    select
      p.id,
      p.member_number,
      coalesce(p.voyage_lineage_enabled, true)
    into referrer, referrer_n, referrer_lineage
    from public.profiles p
    where p.member_number = p_referred_by_member_number
    limit 1;

    -- Self, unknown, or passer opted out → organic
    if referrer is null
       or not referrer_lineage
       or (uid is not null and referrer = uid) then
      referrer := null;
      referrer_n := null;
    end if;
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
      referred_by_user_id := existing.referred_by_user_id;
      referred_by_member_number := existing.referred_by_member_number;
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
      user_id,
      film_id,
      viewer_number,
      film_version,
      film_version_id,
      referred_by_user_id,
      referred_by_member_number
    )
    values (uid, p_film_id, assigned, live_n, live_id, referrer, referrer_n)
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
    referred_by_user_id := existing.referred_by_user_id;
    referred_by_member_number := existing.referred_by_member_number;
    return next;
    return;
  end if;

  viewer_number := assigned;
  recorded := false;
  user_id := null;
  film_version := live_n;
  film_version_id := live_id;
  referred_by_user_id := null;
  referred_by_member_number := null;
  return next;
end;
$$;

grant execute on function public.record_film_view(uuid, integer) to anon, authenticated;

-- Which of these member #s have opted out (for display redaction).
create or replace function public.lineage_opted_out_member_numbers(
  p_member_numbers integer[]
)
returns table (member_number integer)
language sql
stable
security definer
set search_path = public
as $$
  select p.member_number
  from public.profiles p
  where p.member_number = any (p_member_numbers)
    and coalesce(p.voyage_lineage_enabled, true) = false;
$$;

revoke all on function public.lineage_opted_out_member_numbers(integer[])
  from public, anon;
grant execute on function public.lineage_opted_out_member_numbers(integer[])
  to authenticated, anon;
