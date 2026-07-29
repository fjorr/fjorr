-- =============================================================================
-- Viewer # counts every qualifying watch (member + anonymous).
-- Members also get a passport stamp with the number they were assigned.
-- =============================================================================

create or replace function public.record_film_view(p_film_id uuid)
returns table (
  viewer_number bigint,
  stamped boolean,
  user_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  existing public.film_view_stamp;
  assigned bigint;
begin
  if p_film_id is null then
    raise exception 'film_id required';
  end if;

  if not exists (select 1 from public.film f where f.id = p_film_id) then
    raise exception 'Unknown film';
  end if;

  -- Signed-in: already stamped → return existing number (no new count)
  if uid is not null then
    select * into existing
    from public.film_view_stamp s
    where s.user_id = uid and s.film_id = p_film_id;

    if found then
      viewer_number := existing.viewer_number;
      stamped := true;
      user_id := existing.user_id;
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
    insert into public.film_view_stamp (user_id, film_id, viewer_number)
    values (uid, p_film_id, assigned)
    on conflict (user_id, film_id) do nothing
    returning * into existing;

    if existing is null then
      select * into existing
      from public.film_view_stamp s
      where s.user_id = uid and s.film_id = p_film_id;
    end if;

    viewer_number := existing.viewer_number;
    stamped := true;
    user_id := existing.user_id;
    return next;
    return;
  end if;

  -- Anonymous: count only (no stamp / passport row)
  viewer_number := assigned;
  stamped := false;
  user_id := null;
  return next;
end;
$$;

comment on function public.record_film_view(uuid) is
  'Allocate next Viewer # for a film. Anonymous counts; signed-in also writes passport stamp.';

grant execute on function public.record_film_view(uuid) to anon, authenticated;

-- Keep old name as wrapper for any lingering callers
create or replace function public.stamp_film_view(p_film_id uuid)
returns public.film_view_stamp
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  row public.film_view_stamp;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  perform public.record_film_view(p_film_id);

  select * into row
  from public.film_view_stamp
  where user_id = uid and film_id = p_film_id;

  return row;
end;
$$;

grant execute on function public.stamp_film_view(uuid) to authenticated;

comment on table public.film_view_stamp is
  'Patron stamp: member passport entry. viewer_number is global per-film ordinal (includes anonymous views).';
