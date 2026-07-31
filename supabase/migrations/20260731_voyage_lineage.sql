-- =============================================================================
-- Voyage lineage — who passed a film to whom (myth, not broadcast).
-- referred_by_user_id is set once at first Voyage, then frozen.
-- Share links use ?via={member_number}; RPC resolves to profiles.id.
-- =============================================================================

alter table public.film_view_record
  add column if not exists referred_by_user_id uuid
  references public.profiles (id) on delete set null;

create index if not exists film_view_record_referred_by_idx
  on public.film_view_record (film_id, referred_by_user_id)
  where referred_by_user_id is not null;

comment on column public.film_view_record.referred_by_user_id is
  'Member who passed this film (via share link). NULL = organic root. Frozen at first log.';

-- record_film_view: optional referrer by Voyageur member number
drop function if exists public.record_film_view(uuid);
drop function if exists public.record_film_view(uuid, uuid);
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
  referred_by_user_id uuid
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

  -- Resolve via=member_number → profiles.id; ignore unknown / self
  if p_referred_by_member_number is not null
     and p_referred_by_member_number > 0 then
    select p.id into referrer
    from public.profiles p
    where p.member_number = p_referred_by_member_number
    limit 1;

    if referrer is not null and uid is not null and referrer = uid then
      referrer := null;
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
      referred_by_user_id
    )
    values (uid, p_film_id, assigned, live_n, live_id, referrer)
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
    return next;
    return;
  end if;

  viewer_number := assigned;
  recorded := false;
  user_id := null;
  film_version := live_n;
  film_version_id := live_id;
  referred_by_user_id := null;
  return next;
end;
$$;

comment on function public.record_film_view(uuid, integer) is
  'Allocate Viewer #. Signed-in members write a Voyage stamped with live cut + optional via member #.';

grant execute on function public.record_film_view(uuid, integer) to anon, authenticated;

-- Lineage stats. Security definer; authorize in app (own user or service).
create or replace function public.voyage_lineage_stats(
  p_film_id uuid,
  p_user_id uuid
)
returns table (
  direct_referrals bigint,
  downstream_total bigint,
  depth_from_root integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_film_id is null or p_user_id is null then
    raise exception 'film_id and user_id required';
  end if;

  select count(*)::bigint into direct_referrals
  from public.film_view_record r
  where r.film_id = p_film_id
    and r.referred_by_user_id = p_user_id;

  with recursive tree as (
    select r.user_id
    from public.film_view_record r
    where r.film_id = p_film_id
      and r.referred_by_user_id = p_user_id
    union all
    select c.user_id
    from public.film_view_record c
    inner join tree t on c.referred_by_user_id = t.user_id
    where c.film_id = p_film_id
  )
  select count(*)::bigint into downstream_total from tree;

  with recursive ascent as (
    select
      r.user_id,
      r.referred_by_user_id,
      0 as depth
    from public.film_view_record r
    where r.film_id = p_film_id
      and r.user_id = p_user_id
    union all
    select
      p.user_id,
      p.referred_by_user_id,
      a.depth + 1
    from public.film_view_record p
    inner join ascent a on p.user_id = a.referred_by_user_id
    where p.film_id = p_film_id
      and a.referred_by_user_id is not null
      and a.depth < 64
  )
  select coalesce(max(depth), 0)::integer into depth_from_root
  from ascent;

  return next;
end;
$$;

revoke all on function public.voyage_lineage_stats(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.voyage_lineage_stats(uuid, uuid)
  to authenticated, service_role;
