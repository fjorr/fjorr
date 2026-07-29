-- =============================================================================
-- Rename stamp → record (tables, columns, RPC)
-- =============================================================================

-- Table + column
alter table if exists public.film_view_stamp
  rename to film_view_record;

alter table public.film_view_record
  rename column stamped_at to recorded_at;

-- Indexes
alter index if exists public.film_view_stamp_user_stamped_idx
  rename to film_view_record_user_recorded_idx;

alter index if exists public.film_view_stamp_film_viewer_idx
  rename to film_view_record_film_viewer_idx;

comment on table public.film_view_record is
  'Film Log entry for a signed-in member. viewer_number is global per-film ordinal (includes anonymous views).';
comment on column public.film_view_record.recorded_at is
  'When this member’s Film Log entry was created.';

-- RLS policies (recreate with new names / table)
drop policy if exists "Stamps owner read" on public.film_view_record;
drop policy if exists "Stamps public profile read" on public.film_view_record;
drop policy if exists "Records owner read" on public.film_view_record;
drop policy if exists "Records public profile read" on public.film_view_record;

create policy "Records owner read"
  on public.film_view_record
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Records public profile read"
  on public.film_view_record
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = film_view_record.user_id
        and p.is_public = true
    )
  );

revoke insert, update, delete on public.film_view_record from anon, authenticated;
grant select on public.film_view_record to anon, authenticated;

-- RPC: record_film_view returns recorded (not stamped)
drop function if exists public.record_film_view(uuid);

create or replace function public.record_film_view(p_film_id uuid)
returns table (
  viewer_number bigint,
  recorded boolean,
  user_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  existing public.film_view_record;
  assigned bigint;
begin
  if p_film_id is null then
    raise exception 'film_id required';
  end if;

  if not exists (select 1 from public.film f where f.id = p_film_id) then
    raise exception 'Unknown film';
  end if;

  if uid is not null then
    select * into existing
    from public.film_view_record r
    where r.user_id = uid and r.film_id = p_film_id;

    if found then
      viewer_number := existing.viewer_number;
      recorded := true;
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
    insert into public.film_view_record (user_id, film_id, viewer_number)
    values (uid, p_film_id, assigned)
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
    return next;
    return;
  end if;

  viewer_number := assigned;
  recorded := false;
  user_id := null;
  return next;
end;
$$;

comment on function public.record_film_view(uuid) is
  'Allocate next Viewer # for a film. Anonymous counts; signed-in also writes a Film Log record.';

grant execute on function public.record_film_view(uuid) to anon, authenticated;

-- Remove legacy stamp_film_view
drop function if exists public.stamp_film_view(uuid);
