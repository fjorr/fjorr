-- Voyageur stamps only for active Bureaux members.
-- Signed-in unpaid accounts do not receive viewer numbers.

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
  bureaux_ok boolean := false;
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

  if uid is not null then
    select exists (
      select 1
      from public.bureaux_memberships m
      where m.user_id = uid
        and (
          m.status in ('active', 'past_due')
          or (
            m.status = 'canceled'
            and m.current_period_end is not null
            and m.current_period_end > now()
          )
        )
    )
    into bureaux_ok;
  end if;

  if p_referred_by_member_number is not null
     and p_referred_by_member_number > 0 then
    select p.id, p.member_number into referrer, referrer_n
    from public.profiles p
    where p.member_number = p_referred_by_member_number
    limit 1;

    if referrer is not null and uid is not null and referrer = uid then
      referrer := null;
      referrer_n := null;
    end if;
  end if;

  -- Existing stamp (including legacy pre-Bureaux stamps) still returns.
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

    -- No new Voyageur number without active Bureaux.
    if not bureaux_ok then
      viewer_number := null;
      recorded := false;
      user_id := uid;
      film_version := live_n;
      film_version_id := live_id;
      referred_by_user_id := null;
      referred_by_member_number := null;
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

  -- Anonymous view pulse — no personal Voyageur stamp.
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

comment on function public.record_film_view(uuid, integer) is
  'Records a film view. Voyageur stamps only for active Bureaux members.';

grant execute on function public.record_film_view(uuid, integer) to anon, authenticated;
